export interface AudioLibraryItem {
  id: string;
  title: string;
  creator: string;
  collection: string;
  description: string;
  audioUrl: string;
  sourceUrl: string;
  licenseName: string;
  licenseUrl: string;
}

export const AUDIO_LIBRARY: AudioLibraryItem[] = [
  {
    id: 'sala-city',
    title: 'حكاية مدينة سلا',
    creator: 'الراوي غير محدد في بيانات الملف؛ العنوان يذكر Yassine Ettysir',
    collection: 'حكايات من التاريخ',
    description: 'مقال صوتي عربي عن مدينة سلا، من مشروع المقالات الصوتية المغربية على ويكيبيديا.',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/28/History_of_Sal%C3%A9_City_Audio_article_on_Arabic_Wikipedia%2C_narrated_by_Yassine_Ettysir.mp3',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:History_of_Sal%C3%A9_City_Audio_article_on_Arabic_Wikipedia,_narrated_by_Yassine_Ettysir.mp3',
    licenseName: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  {
    id: 'yusuf-ibn-tashfin',
    title: 'حكاية يوسف بن تاشفين',
    creator: 'Mounir Neddi (رافع الملف)؛ Mohamed Ousli، Yassine Ettysir، Zakaria Lagraini (بحسب عنوان الملف)',
    collection: 'حكايات من التاريخ',
    description: 'مقال صوتي عربي عن يوسف بن تاشفين، من مشروع المقالات الصوتية المغربية على ويكيبيديا.',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Yusuf_ibn_Tashfin_Audio_article_on_Arabic_Wikipedia%2C_narrated_by_Mohamed_Ousli_and_Yassine_Ettysir_and_Zakaria_Lagraini.mp3',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Yusuf_ibn_Tashfin_Audio_article_on_Arabic_Wikipedia,_narrated_by_Mohamed_Ousli_and_Yassine_Ettysir_and_Zakaria_Lagraini.mp3',
    licenseName: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  {
    id: 'ismail-ibn-sharif',
    title: 'حكاية إسماعيل بن الشريف',
    creator: 'Mounir Neddi (رافع الملف)؛ Najia Mokhtari، Mrabet Hassana (بحسب عنوان الملف)',
    collection: 'حكايات من التاريخ',
    description: 'مقال صوتي عربي عن إسماعيل بن الشريف، منشور كعمل ذاتي على Wikimedia Commons.',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Ismail_Ibn_Sharif_Audio_article_on_Arabic_Wikipedia%2C_narrated_by_Najia_Mokhtari_and_Mrabet_Hassana.mp3',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Ismail_Ibn_Sharif_Audio_article_on_Arabic_Wikipedia,_narrated_by_Najia_Mokhtari_and_Mrabet_Hassana.mp3',
    licenseName: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
];
