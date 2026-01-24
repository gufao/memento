export type Locale = 'en' | 'pt-BR';

export const translations = {
  en: {
    app: {
      title: 'Memento',
      fastSimple: 'Fast & Simple',
      heroTitle: 'Download YouTube Videos',
      heroSubtitle: 'Paste any YouTube link below and save videos to your computer instantly',
    },
    urlInput: {
      placeholder: 'Paste YouTube URL here...',
      download: 'Download',
      fetching: 'Fetching...',
      helperText: 'Supports YouTube videos, shorts, and playlists',
    },
    downloadQueue: {
      title: 'Downloads',
      fetchingInfo: 'Fetching info...',
      done: 'Done',
      showInFolder: 'Show in Folder',
      openFile: 'Open File',
    }
  },
  'pt-BR': {
    app: {
      title: 'Memento',
      fastSimple: 'Rápido & Simples',
      heroTitle: 'Baixar Vídeos do YouTube',
      heroSubtitle: 'Cole qualquer link do YouTube abaixo e salve vídeos no seu computador instantaneamente',
    },
    urlInput: {
      placeholder: 'Cole a URL do YouTube aqui...',
      download: 'Baixar',
      fetching: 'Buscando...',
      helperText: 'Suporta vídeos, shorts e playlists do YouTube',
    },
    downloadQueue: {
      title: 'Downloads',
      fetchingInfo: 'Obtendo informações...',
      done: 'Concluído',
      showInFolder: 'Mostrar na Pasta',
      openFile: 'Abrir Arquivo',
    }
  }
};
