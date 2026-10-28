"""Shared user image-generation credit ledger services."""

from __future__ import annotations

from dataclasses import dataclass, replace

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import QuerySet

from apps.recommendations.models import (
    ImageCreditRequest,
    PendingBaleRedesignRequest,
    RedesignSession,
    UserImageCreditAccount,
    UserImageCreditTransaction,
    UserImagePlan,
    UserImagePurchase,
)
from apps.users.models import User
from apps.users.image_credit_policy import has_unlimited_image_credits


class InsufficientUserImageCreditsError(ValidationError):
    """Raised when a user has no free or paid image generations left."""


@dataclass(frozen=True)
class CreditSummary:
    """Serializable snapshot of a user's current image generation balance."""

    free_generations_remaining: int
    paid_generations_balance: int
    total_available_generations: int
    free_generations_granted: int
    free_generations_used: int
    total_paid_generations_added: int
    total_paid_generations_used: int
    is_unlimited: bool = False

    def as_dict(self) -> dict[str, int | bool]:
        return {
            'free_generations_remaining': self.free_generations_remaining,
            'paid_generations_balance': self.paid_generations_balance,
            'total_available_generations': self.total_available_generations,
            'free_generations_granted': self.free_generations_granted,
            'free_generations_used': self.free_generations_used,
            'total_paid_generations_added': self.total_paid_generations_added,
            'total_paid_generations_used': self.total_paid_generations_used,
            'is_unlimited': self.is_unlimited,
        }


class UserImageCreditService:
    """Atomic operations for user image generation balances."""

    FREE_POLICY_LIFETIME = 'lifetime'

    @classmethod
    def get_free_policy(cls) -> str:
        """Return the configured free-image policy."""
        return getattr(settings, 'BALE_FREE_IMAGE_POLICY', cls.FREE_POLICY_LIFETIME)

    @staticmethod
    def get_free_generation_allowance() -> int:
        """Return the configured free generation allowance."""
        return max(int(getattr(settings, 'BALE_FREE_IMAGE_GENERATIONS', 1)), 0)

    @classmethod
    def get_or_create_account(cls, user: User) -> UserImageCreditAccount:
        with transaction.atomic():
            initial = max(int(getattr(settings, 'HOMA_NEW_USER_IMAGE_CREDITS', 5)), 0)
            account, created = UserImageCreditAccount.objects.get_or_create(
                user=user, defaults={'free_generations_granted': initial})
            if created and initial:
                cls._create_transaction(account=account, amount=initial,
                    transaction_type='FREE_GRANT', credit_source='free',
                    reason='One-time welcome image credits.')
            return account

    @classmethod
    def get_balance_summary(cls, user: User) -> CreditSummary:
        with transaction.atomic():
            account = cls._get_locked_account(user)
            cls._grant_free_allowance_if_needed(account)
            account.refresh_from_db()
            return replace(cls._build_summary(account), is_unlimited=has_unlimited_image_credits(user))

    @classmethod
    def list_active_plans(cls) -> QuerySet[UserImagePlan]:
        return UserImagePlan.objects.filter(is_active=True).order_by('display_order', 'id')

    @classmethod
    @transaction.atomic
    def add_paid_generations(
            cls,
            user: User,
            amount: int,
            *,
            transaction_type: str = 'PLAN_PURCHASE',
            reason: str = '',
            related_plan: UserImagePlan | None = None,
            related_purchase: UserImagePurchase | None = None,
            related_pending_request: PendingBaleRedesignRequest | None = None,
            related_credit_request: ImageCreditRequest | None = None,
    ) -> UserImageCreditTransaction:
        """Add paid generations to the user's balance and create an audit row."""
        if amount <= 0:
            raise ValidationError('amount must be positive')

        account = cls._get_locked_account(user)
        cls._grant_free_allowance_if_needed(account)

        account.paid_generations_balance += amount
        account.total_paid_generations_added += amount
        account.save(
            update_fields=[
                'paid_generations_balance',
                'total_paid_generations_added',
                'updated_at',
            ]
        )
        return cls._create_transaction(
            account=account,
            amount=amount,
            transaction_type=transaction_type,
            credit_source='paid',
            reason=reason,
            related_plan=related_plan,
            related_purchase=related_purchase,
            related_pending_request=related_pending_request,
            related_credit_request=related_credit_request,
        )

    @classmethod
    @transaction.atomic
    def grant_free_generations(
            cls,
            user: User,
            amount: int,
            *,
            transaction_type: str = 'FREE_GRANT',
            reason: str = '',
            related_pending_request: PendingBaleRedesignRequest | None = None,
            related_credit_request: ImageCreditRequest | None = None,
    ) -> UserImageCreditTransaction:
        """Grant additional free generations to a user and record the ledger row."""
        if amount <= 0:
            raise ValidationError('amount must be positive')

        account = cls._get_locked_account(user)
        cls._grant_free_allowance_if_needed(account)

        account.free_generations_granted += amount
        account.save(update_fields=['free_generations_granted', 'updated_at'])
        return cls._create_transaction(
            account=account,
            amount=amount,
            transaction_type=transaction_type,
            credit_source='free',
            reason=reason or 'Manual free image generation grant.',
            related_pending_request=related_pending_request,
            related_credit_request=related_credit_request,
        )

    @classmethod
    @transaction.atomic
    def remove_paid_generations(
            cls,
            user: User,
            amount: int,
            *,
            transaction_type: str = 'ADMIN_REMOVE',
            reason: str = '',
            related_pending_request: PendingBaleRedesignRequest | None = None,
    ) -> UserImageCreditTransaction:
        """Remove paid generations from the user's balance."""
        if amount <= 0:
            raise ValidationError('amount must be positive')

        account = cls._get_locked_account(user)
        cls._grant_free_allowance_if_needed(account)

        if account.paid_generations_balance < amount:
            raise InsufficientUserImageCreditsError('Not enough paid generations to remove.')

        account.paid_generations_balance -= amount
        account.save(update_fields=['paid_generations_balance', 'updated_at'])
        return cls._create_transaction(
            account=account,
            amount=-amount,
            transaction_type=transaction_type,
            credit_source='paid',
            reason=reason,
            related_pending_request=related_pending_request,
        )

    @classmethod
    @transaction.atomic
    def remove_free_generations(
            cls,
            user: User,
            amount: int,
            *,
            transaction_type: str = 'ADMIN_REMOVE',
            reason: str = '',
            related_pending_request: PendingBaleRedesignRequest | None = None,
    ) -> UserImageCreditTransaction:
        """Remove free generations from the user's current remaining balance."""
        if amount <= 0:
            raise ValidationError('amount must be positive')

        account = cls._get_locked_account(user)
        cls._grant_free_allowance_if_needed(account)

        if account.free_generations_remaining < amount:
            raise InsufficientUserImageCreditsError('Not enough free generations to remove.')

        allowance = cls.get_free_generation_allowance()
        reducible_grant = max(account.free_generations_granted - allowance, 0)
        granted_reduction = min(reducible_grant, amount)
        used_increase = amount - granted_reduction

        update_fields = ['updated_at']
        if granted_reduction:
            account.free_generations_granted -= granted_reduction
            update_fields.append('free_generations_granted')
        if used_increase:
            account.free_generations_used += used_increase
            update_fields.append('free_generations_used')

        account.save(update_fields=update_fields)
        return cls._create_transaction(
            account=account,
            amount=-amount,
            transaction_type=transaction_type,
            credit_source='free',
            reason=reason,
            related_pending_request=related_pending_request,
        )

    @classmethod
    @transaction.atomic
    def consume_for_redesign(
            cls,
            *,
            user: User,
            reason: str,
            related_pending_request: PendingBaleRedesignRequest | None = None,
    ) -> UserImageCreditTransaction:
        """Consume one available image generation for a redesign session."""
        account = cls._get_locked_account(user)
        cls._grant_free_allowance_if_needed(account)

        if has_unlimited_image_credits(user):
            # Preserve a ledger ID for Studio/chat idempotency, without charging.
            return cls._create_transaction(
                account=account, amount=0, transaction_type='IMAGE_CONSUME',
                reason=f'Unlimited isolated tester: {reason}',
                related_pending_request=related_pending_request,
            )

        if account.free_generations_remaining > 0:
            account.free_generations_used += 1
            credit_source = 'free'
            fields = ['free_generations_used', 'updated_at']
        elif account.paid_generations_balance > 0:
            account.paid_generations_balance -= 1
            account.total_paid_generations_used += 1
            credit_source = 'paid'
            fields = [
                'paid_generations_balance',
                'total_paid_generations_used',
                'updated_at',
            ]
        else:
            raise InsufficientUserImageCreditsError('No free or paid image generations remain.')

        account.save(update_fields=fields)
        return cls._create_transaction(
            account=account,
            amount=-1,
            transaction_type='IMAGE_CONSUME',
            credit_source=credit_source,
            reason=reason,
            related_pending_request=related_pending_request,
        )

    @classmethod
    @transaction.atomic
    def link_consumption_to_session(
            cls,
            consumption_transaction: UserImageCreditTransaction,
            redesign_session: RedesignSession,
    ) -> UserImageCreditTransaction:
        """Attach a previously created consumption ledger row to a session."""
        consumption_transaction = UserImageCreditTransaction.objects.select_for_update().get(
            pk=consumption_transaction.pk
        )
        consumption_transaction.related_redesign_session = redesign_session
        consumption_transaction.save(update_fields=['related_redesign_session'])
        return consumption_transaction

    @classmethod
    @transaction.atomic
    def refund_for_redesign_session(
            cls,
            redesign_session: RedesignSession,
            *,
            reason: str,
    ) -> UserImageCreditTransaction | None:
        """Refund the consumed generation for a failed redesign session once."""
        existing_refund = UserImageCreditTransaction.objects.filter(
            transaction_type='IMAGE_REFUND',
            related_redesign_session=redesign_session,
        ).first()
        if existing_refund:
            return existing_refund

        consumption = UserImageCreditTransaction.objects.select_for_update().filter(
            transaction_type='IMAGE_CONSUME',
            related_redesign_session=redesign_session,
        ).order_by('-created_at').first()
        if not consumption:
            return None

        account = cls._get_locked_account(redesign_session.user)
        return cls._refund_consumption_locked(
            consumption, account=account, reason=reason,
            related_redesign_session=redesign_session,
        )

    @classmethod
    @transaction.atomic
    def refund_consumption_transaction(
            cls, transaction_id: int, *, user: User, reason: str,
    ) -> UserImageCreditTransaction | None:
        """Refund a standalone chat consumption; the caller owns idempotency."""
        consumption = UserImageCreditTransaction.objects.select_for_update().filter(
            pk=transaction_id, user=user, transaction_type='IMAGE_CONSUME',
        ).first()
        if not consumption:
            return None
        account = cls._get_locked_account(user)
        return cls._refund_consumption_locked(consumption, account=account, reason=reason)

    @classmethod
    def _refund_consumption_locked(
            cls, consumption, *, account, reason, related_redesign_session=None,
    ):
        if consumption.amount == 0:
            return None  # An uncharged tester request must not generate a refund.
        if consumption.credit_source == 'free':
            account.free_generations_used = max(account.free_generations_used - 1, 0)
            fields = ['free_generations_used', 'updated_at']
        else:
            account.paid_generations_balance += 1
            account.total_paid_generations_used = max(account.total_paid_generations_used - 1, 0)
            fields = ['paid_generations_balance', 'total_paid_generations_used', 'updated_at']
        account.save(update_fields=fields)
        return cls._create_transaction(
            account=account, amount=1, transaction_type='IMAGE_REFUND',
            credit_source=consumption.credit_source, reason=reason,
            related_plan=consumption.related_plan,
            related_purchase=consumption.related_purchase,
            related_redesign_session=related_redesign_session,
            related_pending_request=consumption.related_pending_request,
        )

    @classmethod
    def serialize_plan(cls, plan: UserImagePlan) -> dict[str, int | str]:
        return {
            'id': plan.id,
            'code': plan.code,
            'title': plan.title,
            'description': plan.description,
            'price_irr': plan.price_irr,
            'image_generation_count': plan.image_generation_count,
        }

    @classmethod
    def _get_locked_account(cls, user: User) -> UserImageCreditAccount:
        account = cls.get_or_create_account(user)
        return UserImageCreditAccount.objects.select_for_update().get(pk=account.pk)

    @classmethod
    def _grant_free_allowance_if_needed(cls, account: UserImageCreditAccount) -> UserImageCreditAccount:
        if cls.get_free_policy() != cls.FREE_POLICY_LIFETIME:
            raise NotImplementedError('Only lifetime free generation policy is currently implemented.')

        allowance = cls.get_free_generation_allowance()
        if allowance <= account.free_generations_granted:
            return account

        grant_amount = allowance - account.free_generations_granted
        account.free_generations_granted = allowance
        account.save(update_fields=['free_generations_granted', 'updated_at'])
        cls._create_transaction(
            account=account,
            amount=grant_amount,
            transaction_type='FREE_GRANT',
            credit_source='free',
            reason='Configured lifetime free image generation allowance granted.',
        )
        return account

    @classmethod
    def _build_summary(cls, account: UserImageCreditAccount) -> CreditSummary:
        return CreditSummary(
            free_generations_remaining=account.free_generations_remaining,
            paid_generations_balance=account.paid_generations_balance,
            total_available_generations=account.total_available_generations,
            free_generations_granted=account.free_generations_granted,
            free_generations_used=account.free_generations_used,
            total_paid_generations_added=account.total_paid_generations_added,
            total_paid_generations_used=account.total_paid_generations_used,
        )

    @classmethod
    def _create_transaction(
            cls,
            *,
            account: UserImageCreditAccount,
            amount: int,
            transaction_type: str,
            credit_source: str = '',
            reason: str = '',
            related_plan: UserImagePlan | None = None,
            related_purchase: UserImagePurchase | None = None,
            related_redesign_session: RedesignSession | None = None,
            related_pending_request: PendingBaleRedesignRequest | None = None,
            related_credit_request: ImageCreditRequest | None = None,
    ) -> UserImageCreditTransaction:
        return UserImageCreditTransaction.objects.create(
            account=account,
            user=account.user,
            amount=amount,
            transaction_type=transaction_type,
            credit_source=credit_source,
            reason=reason,
            related_plan=related_plan,
            related_purchase=related_purchase,
            related_redesign_session=related_redesign_session,
            related_pending_request=related_pending_request,
            related_credit_request=related_credit_request,
            paid_balance_after=account.paid_generations_balance,
            free_remaining_after=account.free_generations_remaining,
            total_available_after=account.total_available_generations,
        )
