import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "../../../../components/figma/ImageWithFallback";
import { useState, useEffect } from "react";

const INSPIRATIONS = [
  {
    id: 1,
    before: "https://images.unsplash.com/flagged/photo-1556438758-df7b9e0c0fe4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbXB0eSUyMGxpdmluZyUyMHJvb20lMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjYwNTEyNjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    after: "https://images.unsplash.com/photo-1541085929911-dea736e9287b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXJuaXNoZWQlMjBsaXZpbmclMjByb29tJTIwaW50ZXJpb3IlMjBtb2Rlcm58ZW58MXx8fHwxNzY2MDc0MDQ3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    roomType: "اتاق نشیمن",
    designStyle: "مدرن کلاسیک"
  },
  {
    id: 2,
    before: "https://images.unsplash.com/photo-1692133220749-1c55bb918ad8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbXB0eSUyMGJlZHJvb20lMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjYwNzQwNTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    after: "https://images.unsplash.com/photo-1603112089080-3ef8f7bb9dcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXJuaXNoZWQlMjBiZWRyb29tJTIwaW50ZXJpb3IlMjBjb3p5fGVufDF8fHx8MTc2NjA3NDA1NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    roomType: "اتاق خواب",
    designStyle: "مینیمال لوکس"
  },
  {
    id: 3,
    before: "https://images.unsplash.com/photo-1762176211744-735731ee117b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbXB0eSUyMG1vZGVybiUyMHJvb20lMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjYwNzQwNjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    after: "https://images.unsplash.com/photo-1722268994698-b85790171832?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXJuaXNoZWQlMjBtb2Rlcm4lMjByb29tJTIwaW50ZXJpb3IlMjBkZXNpZ258ZW58MXx8fHwxNzY2MDc0MDY2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    roomType: "اتاق نشیمن",
    designStyle: "بوهمین گرم"
  },
  {
    id: 4,
    before: "https://images.unsplash.com/photo-1758405155772-ef0f0077375c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbXB0eSUyMGRpbmluZyUyMHJvb20lMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjYwNzQwNTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    after: "https://images.unsplash.com/photo-1605886290933-7ed7b3240d4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXJuaXNoZWQlMjBkaW5pbmclMjByb29tJTIwaW50ZXJpb3IlMjBtb2Rlcm58ZW58MXx8fHwxNzY2MDc0MDYwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    roomType: "ناهارخوری",
    designStyle: "ساحلی مدرن"
  }
];

function InspirationCard({ item }: { item: typeof INSPIRATIONS[0] }) {
  const [showAfter, setShowAfter] = useState(false);

  useEffect(() => {
    // Randomize start time significantly to ensure desynchronization (0-4s delay)
    const delay = Math.random() * 4000;
    // Also randomize the interval duration slightly per card so they drift (3s-5s)
    const duration = 3000 + Math.random() * 2000;

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setShowAfter(prev => !prev);
      }, duration);
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, []);

  return (
    <motion.div 
      className="flex-shrink-0 w-[85vw] md:w-[400px] group cursor-pointer"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative aspect-[4/3] rounded-[32px] overflow-hidden bg-muted">
        <AnimatePresence mode="wait">
          <motion.div
            key={showAfter ? "after" : "before"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 w-full h-full"
          >
            <ImageWithFallback 
              src={showAfter ? item.after : item.before} 
              alt={`${item.roomType} - ${item.designStyle}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
        
        {/* Label for Before/After state */}
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 z-20">
           <span className="text-xs font-medium text-white" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
             {showAfter ? "بعد" : "قبل"}
           </span>
        </div>


      </div>
    </motion.div>
  );
}

export function InspirationSection() {
  const [activeTab, setActiveTab] = useState(0);
  const FEATURES = [
    { id: 0, label: "اتاق خواب" },
    { id: 1, label: "فرش" },
    { id: 2, label: "مبل" }
  ];

  return null;
}