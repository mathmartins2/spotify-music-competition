import { useEffect, useState } from 'react';

interface MusicWavesProps {
  imageUrl: string;
  isPlaying?: boolean;
}

export function MusicWaves({ imageUrl, isPlaying = true }: MusicWavesProps) {
  const [dominantColor, setDominantColor] = useState('rgb(30, 215, 96)'); // Spotify green default

  useEffect(() => {
    const getAverageColor = async (url: string) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;

        context?.drawImage(img, 0, 0);
        const data = context?.getImageData(0, 0, img.width, img.height).data;

        if (data) {
          let r = 0, g = 0, b = 0;
          for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
          }

          const pixels = data.length / 4;
          r = Math.round(r / pixels);
          g = Math.round(g / pixels);
          b = Math.round(b / pixels);

          setDominantColor(`rgb(${r}, ${g}, ${b})`);
        }
      };

      img.src = url;
    };

    if (imageUrl) {
      getAverageColor(imageUrl);
    }
  }, [imageUrl]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 flex items-end justify-center gap-0.5 overflow-hidden">
      {[...Array(16)].map((_, i) => (
        <div
          key={i}
          className="w-0.5 rounded-t-sm transform transition-all duration-200"
          style={{
            height: `${Math.random() * 100}%`,
            backgroundColor: dominantColor,
            animation: isPlaying ? `musicWave 0.5s ease infinite alternate ${i * 0.05}s` : 'none',
            opacity: isPlaying ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
} 