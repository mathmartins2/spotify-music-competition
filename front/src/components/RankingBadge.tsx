import { motion } from 'framer-motion';

interface RankingBadgeProps {
  rank: number;
}

export function RankingBadge({ rank }: RankingBadgeProps) {
  const badges = {
    1: {
      color: 'from-yellow-400 to-yellow-600',
      icon: '👑',
      scale: 1.1,
    },
    2: {
      color: 'from-gray-300 to-gray-400',
      icon: '🥈',
      scale: 1.05,
    },
    3: {
      color: 'from-amber-600 to-amber-700',
      icon: '🥉',
      scale: 1.02,
    },
  };

  const badge = badges[rank as keyof typeof badges];

  if (!badge) {
    return <span className="text-spotify-lightgray font-bold">#{rank}</span>;
  }

  return (
    <motion.div
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r ${badge.color}`}
      whileHover={{ scale: badge.scale }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <span className="text-lg">{badge.icon}</span>
      <span className="font-bold text-black">#{rank}</span>
    </motion.div>
  );
} 