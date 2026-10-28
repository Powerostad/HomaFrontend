"""
Users app serializers.

All serializers use serializers.Serializer (not ModelSerializer).
"""
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer as BaseTokenObtainPairSerializer

from apps.core.validators import (
    validate_phone_number,
    validate_otp_code,
    validate_password_field,
    validate_passwords_match,
)
from apps.users.models import User
from apps.users.image_credit_policy import has_unlimited_image_credits


class CustomTokenObtainPairSerializer(BaseTokenObtainPairSerializer):
    """
    Custom TokenObtainPairSerializer for adding custom claims to JWT tokens.

    This provides a foundation for easily extending JWT tokens with custom fields.
    To add custom claims, override get_token() method:

    Example:
        @classmethod
        def get_token(cls, user):
            token = super().get_token(user)
            # Add custom claims
            token['phone_number'] = user.phone_number
            token['name'] = user.name
            return token
    """

    @classmethod
    def get_token(cls, user):
        """
        Generate token with custom claims.
        Override this method to add custom fields to the JWT payload.
        """
        token = super().get_token(user)
        # Add custom claims here as needed
        # Example: token['phone_number'] = user.phone_number
        return token


class UserRegisterSerializer(serializers.Serializer):
    """
    Serializer for user registration.

    POST /api/users/register
    """
    phone_number = serializers.CharField(max_length=20, required=True)
    password = serializers.CharField(max_length=128, required=True, write_only=True)
    name = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')

    def validate_phone_number(self, value):
        """Validate phone number format and uniqueness."""
        # Validate format
        value = validate_phone_number(value)

        # Normalize phone number
        value = User.objects.normalize_phone(value)

        # Check uniqueness
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError(_('شماره موبایل قبلا ثبت نام کرده است'))

        return value

    def validate_password(self, value):
        """Validate password strength."""
        return validate_password_field(value)

    def create(self, validated_data):
        """Create user."""
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login.

    POST /api/users/login
    """
    phone_number = serializers.CharField(max_length=20, required=True)
    password = serializers.CharField(max_length=128, required=True, write_only=True)

    def validate(self, attrs):
        """Validate credentials."""
        phone_number = attrs.get('phone_number')
        password = attrs.get('password')

        # Normalize phone number
        phone_number = User.objects.normalize_phone(phone_number)

        # Check user in database
        try:
            user = User.objects.get(phone_number=phone_number, is_active=True)
            if not user.check_password(password):
                raise serializers.ValidationError(_('اطلاعات ورود نادرست است'))
        except User.DoesNotExist:
            raise serializers.ValidationError(_('اطلاعات ورود نادرست است'))

        attrs['user'] = user
        attrs['phone_number'] = phone_number
        return attrs


class UserSerializer(serializers.Serializer):
    """
    Serializer for user data.

    Used in responses to show user information.
    """
    id = serializers.IntegerField(read_only=True)
    phone_number = serializers.CharField(max_length=20, allow_null=True)
    email = serializers.EmailField(read_only=True)
    name = serializers.CharField(max_length=255, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    image_generations_unlimited = serializers.SerializerMethodField()
    image_credit_summary = serializers.SerializerMethodField()

    def get_image_credit_summary(self, obj):
        from apps.recommendations.services.image_credits import UserImageCreditService
        if isinstance(obj, dict):
            from apps.users.models import User
            obj = User.objects.filter(pk=obj.get('id')).first()
        return UserImageCreditService.get_balance_summary(obj).as_dict() if obj else None


    def get_image_generations_unlimited(self, obj) -> bool:
        return has_unlimited_image_credits(obj)


class TokenResponseSerializer(serializers.Serializer):
    """
    Serializer for authentication token response.

    Returns access token, refresh token, and user data.
    """
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    token_type = serializers.CharField(default='bearer')
    expires_in = serializers.IntegerField(help_text='Access token expiry in seconds')
    user = UserSerializer()


class UserUpdateSerializer(serializers.Serializer):
    """
    Serializer for user profile update.

    PUT /api/users/profile
    """
    name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    password = serializers.CharField(max_length=128, required=False, write_only=True)

    def validate_password(self, value):
        """Validate password strength."""
        if value:
            return validate_password_field(value)
        return value

    def update(self, instance, validated_data):
        """Update user instance."""
        if 'name' in validated_data:
            instance.name = validated_data['name']

        if 'password' in validated_data:
            instance.set_password(validated_data['password'])

        instance.save()
        return instance


class LogoutSerializer(serializers.Serializer):
    """
    Serializer for logout request.

    POST /api/users/logout

    Blacklists the provided refresh token to prevent further use.
    """
    refresh_token = serializers.CharField(required=True)
    all_devices = serializers.BooleanField(required=False, default=False)


class GalleryImageSerializer(serializers.Serializer):
    """
    Serializer for gallery image response.

    GET /api/users/gallery

    Image URLs: product images are public CDN URLs; customer/result images are
    private and returned as presigned URLs loaded directly by a plain <img>.
    The raw *_path fields are kept for backward compatibility.
    """
    id = serializers.CharField()
    type = serializers.ChoiceField(choices=['tryon', 'studio'])
    product_id = serializers.IntegerField(allow_null=True)
    product_name = serializers.CharField(allow_null=True)
    product_category = serializers.CharField()
    product_image_path = serializers.CharField(allow_null=True, allow_blank=True,
                                               help_text='Raw MinIO object path (prefer product_image_url)')
    customer_image_path = serializers.CharField(
        help_text='Raw MinIO object path (prefer customer_image_url)')
    result_image_path = serializers.CharField(
        help_text='Raw MinIO object path (prefer result_image_url)')
    product_image_url = serializers.SerializerMethodField(
        help_text='Public CDN URL for the product image')
    customer_image_url = serializers.SerializerMethodField(
        help_text='Presigned URL for the customer-uploaded image')
    result_image_url = serializers.SerializerMethodField(
        help_text='Presigned URL for the generated result image (full-res original)')
    result_image_urls = serializers.SerializerMethodField(
        help_text='Presigned URLs per tier {card, detail, original} for the result image. '
                  'Use card for grid thumbnails, detail for full view.')
    score = serializers.IntegerField(allow_null=True)
    created_at = serializers.DateTimeField()
    claimed_at = serializers.DateTimeField(allow_null=True)
    share_token = serializers.CharField(allow_null=True, required=False)

    def get_product_image_url(self, obj):
        from apps.core.utils import build_public_media_url
        return build_public_media_url(self._field(obj, 'product_image_path'))

    def get_customer_image_url(self, obj):
        from apps.core.utils import build_private_image_url
        return build_private_image_url(self._field(obj, 'customer_image_path'))

    def get_result_image_url(self, obj):
        from apps.core.utils import build_private_image_url
        return build_private_image_url(self._field(obj, 'result_image_path'))

    def get_result_image_urls(self, obj):
        from apps.core.services.private_image_variant_service import build_private_variant_urls
        return build_private_variant_urls(self._field(obj, 'result_image_path'))

    @staticmethod
    def _field(obj, name):
        """Read a field from either a dict or an object."""
        if isinstance(obj, dict):
            return obj.get(name)
        return getattr(obj, name, None)


# OTP Authentication Serializers

class SendOTPRequestSerializer(serializers.Serializer):
    """
    Serializer for sending OTP request.

    POST /api/users/otp/send/
    """
    phone_number = serializers.CharField(
        max_length=20,
        required=True,
        help_text='Iranian phone number (e.g., 09123456789 or +989123456789)',
        validators=[validate_phone_number],
    )
    purpose = serializers.ChoiceField(
        choices=['login', 'reset_password', 'verify_phone'],
        default='login',
        help_text='Purpose of OTP request'
    )
    check_only = serializers.BooleanField(
        default=False,
        required=False,
        help_text='If true, only check user existence without sending OTP'
    )


class SendOTPResponseDataSerializer(serializers.Serializer):
    """Data payload for send OTP response."""
    phone_number = serializers.CharField()
    expires_in_seconds = serializers.IntegerField()
    message = serializers.CharField()


class SendOTPResponseSerializer(serializers.Serializer):
    """
    Response serializer for send OTP endpoint.

    Follows project ResponseMixin format.
    """
    success = serializers.BooleanField()
    message = serializers.CharField()
    data = SendOTPResponseDataSerializer()


class CheckUserResponseDataSerializer(serializers.Serializer):
    """Data payload for check user response."""
    phone_number = serializers.CharField()
    user_exists = serializers.BooleanField()
    has_password = serializers.BooleanField()


class CheckUserResponseSerializer(serializers.Serializer):
    """
    Response serializer for check user endpoint (check_only=true).

    Follows project ResponseMixin format.
    """
    success = serializers.BooleanField()
    message = serializers.CharField()
    data = CheckUserResponseDataSerializer()


class VerifyOTPRequestSerializer(serializers.Serializer):
    """
    Serializer for verifying OTP request.

    POST /api/users/otp/verify/
    """
    phone_number = serializers.CharField(
        max_length=20,
        required=True,
        help_text='Iranian phone number',
        validators=[validate_phone_number],
    )
    otp_code = serializers.CharField(
        min_length=6,
        max_length=6,
        required=True,
        help_text='6-digit OTP code',
        validators=[validate_otp_code],
    )
    purpose = serializers.ChoiceField(
        choices=['login', 'reset_password', 'verify_phone'],
        default='login',
        help_text='Purpose of OTP verification'
    )


class TokenSerializer(serializers.Serializer):
    """Serializer for JWT tokens in OTP flow."""
    access = serializers.CharField()
    refresh = serializers.CharField()


class VerifyOTPResponseDataSerializer(serializers.Serializer):
    """Data payload for verify OTP response."""
    user = UserSerializer()
    tokens = TokenSerializer()


class VerifyOTPResponseSerializer(serializers.Serializer):
    """
    Response serializer for verify OTP endpoint.

    Follows project ResponseMixin format.
    """
    success = serializers.BooleanField()
    message = serializers.CharField()
    data = VerifyOTPResponseDataSerializer()


class ResetPasswordRequestSerializer(serializers.Serializer):
    """
    Serializer for password reset with OTP.

    POST /api/users/password/reset/
    """
    phone_number = serializers.CharField(
        max_length=20,
        required=True,
        help_text='Iranian phone number',
        validators=[validate_phone_number],
    )
    otp_code = serializers.CharField(
        min_length=6,
        max_length=6,
        required=True,
        help_text='6-digit OTP code',
        validators=[validate_otp_code],
    )
    new_password = serializers.CharField(
        min_length=8,
        max_length=128,
        required=True,
        write_only=True,
        help_text='New password (min 8 characters)',
        validators=[validate_password_field],
    )
    confirm_password = serializers.CharField(
        min_length=8,
        max_length=128,
        required=True,
        write_only=True,
        help_text='Confirm new password'
    )

    def validate(self, attrs):
        return validate_passwords_match(attrs)


# VIP Login Serializers

class VIPLoginSerializer(serializers.Serializer):
    """
    Serializer for VIP user login.

    POST /api/users/vip-login/

    VIP users are pre-created by admin with:
    - Fake phone number (bypasses Iranian validation)
    - Username stored in 'name' field
    - Password set via Django admin
    """
    username = serializers.CharField(
        max_length=255,
        required=True,
        help_text='VIP username (stored in name field)'
    )
    password = serializers.CharField(
        max_length=128,
        required=True,
        write_only=True,
        help_text='VIP user password'
    )

    def validate(self, attrs):
        """Validate VIP credentials."""
        username = attrs.get('username')
        password = attrs.get('password')

        # Find user by name field (VIP username)
        try:
            user = User.objects.get(name=username, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError(_('نام کاربری یا رمز عبور اشتباه است'))

        # Verify password
        if not user.check_password(password):
            raise serializers.ValidationError(_('نام کاربری یا رمز عبور اشتباه است'))

        attrs['user'] = user
        return attrs


class SetPasswordRequestSerializer(serializers.Serializer):
    """
    Serializer for setting password for existing OTP users.

    POST /api/users/password/set/
    """
    phone_number = serializers.CharField(
        max_length=20,
        required=True,
        help_text='Iranian phone number',
        validators=[validate_phone_number],
    )
    password = serializers.CharField(
        min_length=8,
        max_length=128,
        required=True,
        write_only=True,
        help_text='New password (min 8 characters)',
        validators=[validate_password_field],
    )
    confirm_password = serializers.CharField(
        min_length=8,
        max_length=128,
        required=True,
        write_only=True,
        help_text='Confirm new password'
    )

    def validate(self, attrs):
        return validate_passwords_match(attrs, password_field='password')


class BaleUserRegisterSerializer(serializers.Serializer):
    phone_number = serializers.CharField(
        max_length=20,
        required=True,
        help_text='Iranian phone number (e.g., 09123456789 or +989123456789)'
    )
    username = serializers.CharField(
        max_length=255,
        required=False,
        help_text='username',
        allow_blank=True,
        allow_null=True,
    )

    def validate_phone_number(self, value: str) -> str:
        """Validate phone number format."""
        return validate_phone_number(value)
