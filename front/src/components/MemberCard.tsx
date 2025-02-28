import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import ColorThief from 'colorthief';
import type { Member } from '../types';
import { SpotifyService } from '../services/spotify';
import { useQuery } from '@tanstack/react-query';

function getMusicThemeIcon(trackName = '', artistName = ''): string {
  const text = (trackName + ' ' + artistName).toLowerCase();

  if (text.includes('rock') || text.includes('metal') || text.includes('guitar')) return '🎸';
  if (text.includes('electro') || text.includes('dj') || text.includes('dance')) return '🎧';
  if (text.includes('pop') || text.includes('hit') || text.includes('chart')) return '🎤';
  if (text.includes('rap') || text.includes('hip hop') || text.includes('trap')) return '🎵';
  if (text.includes('jazz') || text.includes('blues') || text.includes('sax')) return '🎷';
  if (text.includes('classic') || text.includes('orchestra') || text.includes('symphony')) return '🎻';
  if (text.includes('country') || text.includes('folk') || text.includes('acoustic')) return '🪕';
  if (text.includes('reggae') || text.includes('jamaica') || text.includes('marley')) return '🏝️';

  return '🎵';
}

function formatRgbWithOpacity(color: string, opacity = 0.4): string {
  if (!color.includes('rgb')) return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  return color.replace(')', `, ${opacity})`);
}

interface MemberCardProps {
  member: Member;
  index: number;
  children: React.ReactNode;
  id?: string;
}

export function MemberCard({ member, index, children, id }: MemberCardProps) {
  const isFirstPlace = member.rank === 1;
  const isSecondPlace = member.rank === 2;
  const isThirdPlace = member.rank === 3;
  const [colors, setColors] = useState<string[]>(['#1DB954']);
  const [themeIcon, setThemeIcon] = useState<string>('🎵');
  const cardRef = useRef<HTMLDivElement>(null);

  const currentUserId = localStorage.getItem('userId');

  const { data: genres, refetch } = useQuery({
    queryKey: ['trackGenre', (member as any).currentTrackId],
    queryFn: async () => {
      if (!(member as any).topTrackId) return [];
      return SpotifyService.getTrackGenre((member as any).currentTrackId);
    },
    enabled: false
  });

  useEffect(() => {
    if (!genres?.length) {
      const fallbackIcon = getMusicThemeIcon(
        (member as any).topTrackName || '',
        (member as any).topTrackArtist || ''
      );
      setThemeIcon(fallbackIcon);
      return;
    }

    const genreText = genres.join(' ').toLowerCase();

    if (genreText.includes('rock') || genreText.includes('metal')) {
      setThemeIcon('🎸');
      return;
    }

    if (genreText.includes('electro') || genreText.includes('house') || genreText.includes('edm')) {
      setThemeIcon('🎧');
      return;
    }

    if (genreText.includes('pop')) {
      setThemeIcon('🎤');
      return;
    }

    if (genreText.includes('hip hop') || genreText.includes('rap')) {
      setThemeIcon('🎵');
      return;
    }

    if (genreText.includes('jazz') || genreText.includes('blues') ||
      genreText.includes('soul') || genreText.includes('funk')) {
      setThemeIcon('🎷');
      return;
    }

    if (genreText.includes('classic') || genreText.includes('orchestra')) {
      setThemeIcon('🎻');
      return;
    }

    if (genreText.includes('country') || genreText.includes('folk')) {
      setThemeIcon('🪕');
      return;
    }

    if (genreText.includes('reggae')) {
      setThemeIcon('🏝️');
      return;
    }

    const fallbackIcon = getMusicThemeIcon(
      (member as any).topTrackName || '',
      (member as any).topTrackArtist || ''
    );
    setThemeIcon(fallbackIcon);
  }, [genres, member]);

  useEffect(() => {
    if (isFirstPlace && (member as any).currentTrackId) {
      refetch();
    }
  }, [isFirstPlace, member, refetch]);

  useEffect(() => {
    if (!isFirstPlace || !member.currentTrackImage) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = member.currentTrackImage;

    img.onload = () => {
      const colorThief = new ColorThief();
      try {
        const palette = colorThief.getPalette(img, 5);

        const enhancedColors = palette.map(([r, g, b]) => {
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const satBoost = 1.3;

          if (max <= 0) return `rgb(${r}, ${g}, ${b})`;

          const rNew = r + (r - min) * satBoost;
          const gNew = g + (g - min) * satBoost;
          const bNew = b + (b - min) * satBoost;

          return `rgb(${Math.min(255, Math.round(rNew))}, ${Math.min(255, Math.round(gNew))}, ${Math.min(255, Math.round(bNew))})`;
        });

        const uniqueColors = enhancedColors.filter((color, i, arr) => i === arr.findIndex(c => c === color));
        setColors(uniqueColors.length ? uniqueColors : ['#1DB954']);
      } catch (error) {
        setColors(['#1DB954']);
      }
    };
  }, [isFirstPlace, member.currentTrackImage]);

  const getCornerStyle = (position: string, colorIndex = 0) => {
    const color = colors[colorIndex] || colors[0];
    return {
      background: `radial-gradient(circle at ${position}, ${formatRgbWithOpacity(color, 0.4)}, transparent 70%)`,
      filter: 'blur(8px)'
    };
  };

  // Cores específicas para o segundo e terceiro lugares
  const silverColors = ['#C0C0C0', '#A9A9A9', '#D3D3D3'];
  const bronzeColors = ['#CD7F32', '#B8860B', '#D2691E'];

  // Função para obter ícone de medalha com base no ranking
  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const medalIcon = getMedalIcon(member.rank);

  return (
    <motion.div
      ref={cardRef}
      id={id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      className={`
        relative bg-spotify-gray rounded-lg overflow-visible
        transform-gpu backface-visible 
        transition-shadow duration-200
        hover:shadow-xl
        p-2 sm:p-3 md:p-4
        w-full min-h-[12rem] 
        flex flex-col
        ${isFirstPlace ? `hover:shadow-[0_0_15px_${colors[0]}]` : ''}
        ${isSecondPlace ? `hover:shadow-[0_0_10px_${silverColors[0]}]` : ''}
        ${isThirdPlace ? `hover:shadow-[0_0_5px_${bronzeColors[0]}]` : ''}
      `}
    >
      {isFirstPlace && (
        <>
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{
              background: `linear-gradient(135deg, 
                ${formatRgbWithOpacity(colors[0], 0.2)}, 
                rgba(30,30,30,0.8), 
                ${formatRgbWithOpacity(colors[1] || colors[0], 0.2)}
              )`,
              mixBlendMode: 'normal',
            }}
            animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'linear',
            }}
          />

          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${formatRgbWithOpacity(colors[0], 0.33)}, transparent 70%)`,
              mixBlendMode: 'overlay',
            }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div className="absolute inset-0 pointer-events-none" initial={false}>
            <motion.div
              className="absolute -top-4 -left-4 w-24 h-24"
              style={getCornerStyle('30% 30%', 0)}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.7, 0.4],
                rotate: [0, 90, 0],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
              className="absolute -top-4 -right-4 w-24 h-24"
              style={getCornerStyle('70% 30%', 1)}
              animate={{
                scale: [1.3, 1, 1.3],
                opacity: [0.7, 0.4, 0.7],
                rotate: [90, 0, 90],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            <motion.div
              className="absolute -bottom-4 -right-4 w-24 h-24"
              style={getCornerStyle('70% 70%', 2)}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.7, 0.4],
                rotate: [0, -90, 0],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />

            <motion.div
              className="absolute -bottom-4 -left-4 w-24 h-24"
              style={getCornerStyle('30% 70%', 0)}
              animate={{
                scale: [1.3, 1, 1.3],
                opacity: [0.7, 0.4, 0.7],
                rotate: [-90, 0, -90],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            />
          </motion.div>

          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{
              background: `linear-gradient(90deg, ${colors.join(', ')})`,
              padding: '2px',
            }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
              filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-full h-full bg-spotify-gray rounded-lg" />
          </motion.div>

          <motion.div
            className="absolute -inset-1 rounded-lg opacity-30 blur-md"
            style={{ background: `linear-gradient(45deg, ${colors.join(', ')})` }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            className="absolute inset-0 rounded-lg opacity-40"
            style={{
              background: `linear-gradient(45deg, ${colors.join(', ')})`,
              mixBlendMode: 'soft-light',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
              opacity: [0.3, 0.5],
            }}
            transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
          />

          <motion.div className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-screen" initial={false}>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: colors[i % colors.length],
                  filter: 'brightness(1.5)',
                }}
                animate={{
                  y: [-10, 10],
                  x: [-10, 10],
                  opacity: [0, 0.7, 0],
                }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
              />
            ))}
          </motion.div>

          <motion.div className="absolute inset-0 overflow-hidden pointer-events-none" initial={false}>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-lg opacity-40"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 80}%`,
                  filter: `drop-shadow(0 0 2px ${colors[i % colors.length]})`,
                }}
                animate={{
                  y: [-20, 20],
                  x: [-20, 20],
                  rotate: [0, 360],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{ duration: 8 + Math.random() * 4, repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }}
              >
                {themeIcon}
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      {isSecondPlace && (
        <>
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{
              background: `linear-gradient(135deg, 
                rgba(192,192,192,0.2), 
                rgba(30,30,30,0.7), 
                rgba(211,211,211,0.2)
              )`,
              mixBlendMode: 'normal',
            }}
            animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'linear',
            }}
          />

          <motion.div className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-screen" initial={false}>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: silverColors[i % silverColors.length],
                  filter: 'brightness(1.3)',
                }}
                animate={{
                  y: [-5, 5],
                  x: [-5, 5],
                  opacity: [0, 0.5, 0],
                }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
              />
            ))}
          </motion.div>

          <motion.div className="absolute inset-0 overflow-hidden pointer-events-none" initial={false}>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-base opacity-30"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                  filter: `drop-shadow(0 0 1px ${silverColors[i % silverColors.length]})`,
                }}
                animate={{
                  y: [-10, 10],
                  x: [-10, 10],
                  rotate: [0, 180],
                  opacity: [0.2, 0.3, 0.2],
                }}
                transition={{ duration: 6 + Math.random() * 3, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }}
              >
                {themeIcon}
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      {isThirdPlace && (
        <>
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{
              background: `linear-gradient(135deg, 
                rgba(205,127,50,0.15), 
                rgba(30,30,30,0.7), 
                rgba(184,134,11,0.15)
              )`,
              mixBlendMode: 'normal',
            }}
            animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
            transition={{
              duration: 12,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'linear',
            }}
          />

          <motion.div className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-screen" initial={false}>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: bronzeColors[i % bronzeColors.length],
                  filter: 'brightness(1.2)',
                }}
                animate={{
                  y: [-3, 3],
                  x: [-3, 3],
                  opacity: [0, 0.4, 0],
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
              />
            ))}
          </motion.div>

          <motion.div
            className="absolute text-sm opacity-25"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              filter: `drop-shadow(0 0 1px ${bronzeColors[0]})`,
            }}
            animate={{
              y: [-5, 5],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            {themeIcon}
          </motion.div>
        </>
      )}

      <motion.div className="relative z-10 w-full h-full flex flex-col justify-between gap-1 sm:gap-2 overflow-visible text-sm sm:text-base">
        {children}
      </motion.div>
    </motion.div>
  );
}