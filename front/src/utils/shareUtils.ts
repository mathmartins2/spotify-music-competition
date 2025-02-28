import html2canvas from 'html2canvas';

/**
 * Gera uma imagem a partir de um elemento HTML usando html2canvas com alta qualidade
 * @param element Elemento HTML ou objeto Member a ser convertido em imagem
 * @returns Promise com a URL da imagem gerada
 */
export const generateShareImage = async (element: HTMLElement | any): Promise<string> => {
  try {
    // Se for um objeto Member, tente encontrar o elemento pelo ID
    if (!(element instanceof HTMLElement)) {
      const memberId = element.id;
      element = document.getElementById(`member-card-${memberId}`);
      if (!element) {
        throw new Error('Element not found');
      }
    }

    // Atribuir um ID temporário se o elemento não tiver um
    const originalId = element.id;
    const needsTempId = !originalId;
    
    if (needsTempId) {
      element.id = `temp-share-element-${Date.now()}`;
    }

    // Criar clone do elemento para não modificar o original na DOM
    const clone = element.cloneNode(true) as HTMLElement;
    clone.id = `clone-${element.id || Date.now()}`;
    
    // Esconder o clone inicialmente
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '-9999px';
    document.body.appendChild(clone);
    
    // Preparar o clone para captura
    clone.style.transform = 'none';
    clone.style.transition = 'none';
    clone.style.overflow = 'visible';
    clone.style.height = 'auto';
    clone.style.maxHeight = 'none';
    clone.style.width = `${element.offsetWidth}px`;
    clone.style.padding = '8px';
    clone.style.margin = '0';
    clone.style.background = '#121212';
    
    // Remover botões de compartilhamento e loading do clone
    const shareButtons = clone.querySelectorAll('button[class*="rounded-full"]');
    shareButtons.forEach(btn => btn.remove());

    // Verificar se é o card do primeiro lugar (com animações especiais)
    const isFirstPlace = clone.querySelectorAll('[class*="-inset-"]').length > 0 ||
                          clone.innerHTML.includes('crown') || 
                          clone.innerHTML.includes('👑');
    
    // Ajustar as cores de fundo para menos intensas
    if (isFirstPlace) {
      // Encontrar elementos com gradientes ou cores de fundo
      const backgroundElements = clone.querySelectorAll('.absolute, [style*="background"], [class*="bg-"]');
      backgroundElements.forEach((el: HTMLElement) => {
        const style = window.getComputedStyle(el);
        
        // Atenuar cores de fundo
        if (style.background.includes('linear-gradient') || style.background.includes('radial-gradient')) {
          // Reduzir a opacidade dos gradientes
          el.style.opacity = '0.7';
          
          // Ajustar modo de mistura para mais suave
          el.style.mixBlendMode = 'soft-light';
        }
        
        // Verificar elementos com cores RGB que podem estar muito saturadas
        if (style.backgroundColor.includes('rgb')) {
          // Diminuir opacidade para cores intensas
          el.style.backgroundColor = style.backgroundColor.replace(/rgba?\(([^)]+)\)/, 
            (match, values) => {
              const parts = values.split(',');
              // Se for RGB sem alfa, adicionar alfa
              if (parts.length === 3) {
                return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, 0.7)`;
              }
              // Se já tem alfa, reduzir o valor
              else if (parts.length === 4) {
                const alpha = Math.min(0.7, parseFloat(parts[3]));
                return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
              }
              return match;
            });
        }
      });
      
      // Aplicar filtro suave ao card todo para reduzir intensidade de cores
      clone.style.filter = 'saturate(0.85) brightness(0.95)';
      
      // Ajustar efeitos específicos do primeiro lugar
      const glowEffects = clone.querySelectorAll('[class*="blur"], [style*="blur"]');
      glowEffects.forEach((el: HTMLElement) => {
        el.style.opacity = '0.5';  // Reduzir opacidade dos efeitos de brilho
        el.style.filter = 'blur(6px) brightness(0.9)';  // Ajustar blur para ser mais suave
      });
    }

    // Remover elementos vazios ou espaçadores que possam criar espaço extra
    const emptyDivs = clone.querySelectorAll('div:empty');
    emptyDivs.forEach(div => {
      if (!div.hasChildNodes() && !div.textContent?.trim()) {
        div.style.display = 'none';
        div.style.height = '0';
        div.style.margin = '0';
        div.style.padding = '0';
      }
    });
    
    // Expandir todos os elementos colapsados
    const expandedElements = clone.querySelectorAll('[class*="max-h-0"], [class*="opacity-0"]');
    expandedElements.forEach((el: HTMLElement) => {
      el.style.maxHeight = 'none';
      el.style.opacity = '1';
      el.style.display = 'block';
    });
    
    // Forçar todas as imagens a serem visíveis
    const images = clone.querySelectorAll('img');
    images.forEach((img) => {
      img.style.display = 'block';
      img.style.opacity = '1';
      img.style.visibility = 'visible';
    });
    
    // Forçar todos os textos a serem visíveis
    const textElements = clone.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
    textElements.forEach((el: HTMLElement) => {
      el.style.textOverflow = 'visible';
      el.style.overflow = 'visible';
      el.style.whiteSpace = 'normal';
      el.style.height = 'auto';
      el.style.maxHeight = 'none';
    });
    
    // Garantir que acordeões estejam expandidos
    const collapsibleSections = clone.querySelectorAll('[class*="collapsed"], [class*="expandable"]');
    collapsibleSections.forEach((section: HTMLElement) => {
      section.style.maxHeight = 'none';
      section.style.height = 'auto';
      section.style.display = 'block';
      section.style.visibility = 'visible';
      section.style.opacity = '1';
    });

    // Remover ponteiros de eventos e animações absolutas que possam causar espaços extras
    const absoluteElements = clone.querySelectorAll('.absolute, [class*="pointer-events-none"]');
    absoluteElements.forEach((el: HTMLElement) => {
      if (el.classList.contains('inset-0') || 
          el.style.bottom === '-4px' || 
          el.classList.contains('overflow-hidden')) {
        // Manter apenas elementos essenciais, ajustar posicionamentos problemáticos
        el.style.bottom = '0';
        el.style.height = 'auto';
      }
    });
    
    if (isFirstPlace) {
      // Otimizações específicas para o card do primeiro lugar
      // Remover elementos decorativos extras que podem adicionar espaço
      const decorations = clone.querySelectorAll('[class*="absolute inset"]');
      decorations.forEach((el: HTMLElement) => {
        if (el.classList.contains('-inset-1') || el.classList.contains('-bottom-4')) {
          el.style.bottom = '0';
          el.style.inset = '0';
        }
      });

      // Garantir que o conteúdo principal seja priorizado
      const mainContent = clone.querySelector('[class*="relative z-10"]') as HTMLElement;
      if (mainContent) {
        // Certificar que o conteúdo principal não tem padding/margin extra
        mainContent.style.paddingBottom = '0';
        mainContent.style.marginBottom = '0';
      }
    }
    
    // Forçar um recálculo de layout antes da captura
    void clone.offsetHeight;
    
    // Garantir tempo para o clone renderizar
    await new Promise(resolve => setTimeout(resolve, 100));

    // Calcular altura adequada do conteúdo (encontrar o último elemento real)
    const childNodes = Array.from(clone.querySelectorAll('*'));
    let maxVisibleHeight = 0;
    
    childNodes.forEach(node => {
      if (node instanceof HTMLElement && 
          window.getComputedStyle(node).display !== 'none' &&
          !node.classList.contains('absolute')) {
        const rect = node.getBoundingClientRect();
        const bottom = node.offsetTop + rect.height;
        if (bottom > maxVisibleHeight) {
          maxVisibleHeight = bottom;
        }
      }
    });
    
    // Adicionar um pequeno padding à altura final
    const contentHeight = maxVisibleHeight + 12;

    // Configurações para melhor qualidade
    const canvas = await html2canvas(clone, {
      scale: 2, // Escala 2x para melhor qualidade
      useCORS: true, // Permitir imagens de outros domínios
      allowTaint: true, // Permitir imagens "tainted"
      backgroundColor: '#121212', // Cor de fundo do Spotify
      logging: false,
      imageTimeout: 0, // Sem timeout para carregamento de imagens
      width: clone.offsetWidth,
      height: Math.min(contentHeight, clone.scrollHeight), // Usar altura calculada
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.offsetHeight,
      ignoreElements: (element) => {
        // Ignorar botões de compartilhamento e loading
        return element.tagName === 'BUTTON' && 
               (element.className.includes('rounded-full') || 
                element.className.includes('animate-spin'));
      }
    });

    // Remover o clone da DOM
    document.body.removeChild(clone);

    // Retorna a URL da imagem em formato PNG com alta qualidade
    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error('Error generating image:', error);
    return '';
  }
};

/**
 * Compartilha uma imagem em dispositivos móveis usando a Web Share API
 * @param imageUrl URL da imagem a ser compartilhada
 * @param title Título para o compartilhamento
 */
export const shareOnMobile = async (imageUrl: string, title: string): Promise<void> => {
  try {
    // Converter data URL para Blob
    const blob = await fetch(imageUrl).then(res => res.blob());
    
    // Criar um arquivo para compartilhamento
    const file = new File([blob], 'spotify-stats.png', { type: 'image/png' });
    
    // Usar a Web Share API para compartilhar
    await navigator.share({
      title: title,
      text: 'Check out these Spotify stats!',
      files: [file]
    });
  } catch (error) {
    console.error('Error sharing:', error);
    // Se falhar, tentar fazer download
    downloadImage(imageUrl, 'spotify-stats.png');
  }
};

/**
 * Faz o download de uma imagem para o dispositivo do usuário
 * @param imageUrl URL da imagem para download
 * @param fileName Nome do arquivo para download
 */
export const downloadImage = (imageUrl: string, fileName: string): void => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}; 