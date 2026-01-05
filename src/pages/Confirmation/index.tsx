import { useEffect } from "react";
import { useNavigate as useRouterNavigate } from "react-router-dom";
import { motion as Motion } from "motion/react";
import { useApp } from "../../context/AppContext";

export function ConfirmationPage() {
  const navigate = useRouterNavigate();
  const { product } = useApp();

  useEffect(() => {
    // Wait for animation then go to result
    const timer = setTimeout(() => {
      navigate("/result");
    }, 3000); // 3 seconds animation

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white flex items-center justify-center p-4"
    >
      <div className="text-center">
        <Motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <div
            style={{
              fontSize: "96px",
              fontFamily: '"Inter", "Helvetica Neue", "Helvetica", Arial, sans-serif',
              fontWeight: 700,
              letterSpacing: "-4px",
              color: "#000",
              textTransform: "uppercase",
              lineHeight: "1",
            }}
          >
            HOMA
          </div>
        </Motion.div>

        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <Motion.div
                key={i}
                className="w-3 h-3 bg-gray-900 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>

        <Motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600"
          style={{ fontSize: "16px" }}
        >
          منتظر باشید
        </Motion.p>

        {product && (
          <Motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400 mt-4"
            style={{ fontSize: "14px" }}
          >
            در حال تست {product.name} در فضای شما...
          </Motion.p>
        )}
      </div>
    </Motion.div>
  );
}