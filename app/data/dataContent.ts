export type ContentSection = {
  text?: string;
};

export type CardDataItem = {
  category: string;
  title: string;
  src: string;
  sections?: ContentSection[];
  text?: string;
  imageUrl?: string; 
};

export const cardData: CardDataItem[] = [
  {
    category: "Jasa",
    title: "Tukang Listrik",
    src: "/tukanglistrik.jpg",
    sections: [
      {
        text:
          "• Instalasi Listrik Baru: Pemasangan sistem kelistrikan pada rumah atau bangunan baru.",
      },
      {
        text:
          "• Perbaikan dan Pemeliharaan: Menangani gangguan listrik seperti MCB turun, kabel terbakar, atau korsleting.",
      },
      {
        text:
          "• Penambahan Titik Listrik: Menambah stopkontak atau titik lampu tanpa membongkar instalasi lama.",
      },
      {
        text:
          "• Pengecekan dan Sertifikasi Keamanan: Memastikan instalasi listrik dalam kondisi aman dan efisien.",
      },
      {
        text:
          "• Pemasangan Perangkat Elektronik dan Smart Home: Instalasi perangkat yang terhubung ke sistem listrik rumah.",
      },
      {
        text:
          "• Pemasangan Panel Surya atau Backup Power: Instalasi panel surya, inverter, atau genset rumah tangga.",
      },
    ],
  },
  {
    category: "Jasa",
    title: "Tukang AC",
    src: "/tukangac.jpg",
    sections: [
      {
        text:
          "• Instalasi AC Baru: Pemasangan AC dengan survei ruangan, instalasi pipa tembaga, dan pengujian sistem.",
      },
      {
        text:
          "• Servis Cuci & Perawatan Berkala: Pembersihan evaporator, blower, dan pengecekan tekanan serta suhu.",
      },
      {
        text:
          "• Perbaikan Gangguan/Repair: Menangani AC kurang dingin, kebocoran air, atau bunyi berisik.",
      },
      {
        text:
          "• Penanganan Refrigeran & Kebocoran: Deteksi dan perbaikan kebocoran refrigeran serta pengisian ulang sesuai spesifikasi.",
      },
      {
        text:
          "• Optimasi Efisiensi & Upgrade: Perbaikan aliran udara dan peningkatan efisiensi AC dengan unit inverter.",
      },
    ],
  },
  {
    category: "Jasa",
    title: "Tukang Pembersihan Rumah",
    src: "/tukangbersih.jpg",
    sections: [
      {
        text:
          "• Pembersihan Rutin: Menjaga kebersihan harian dengan menyapu, mengepel, dan merapikan kamar.",
      },
      {
        text:
          "• Pembersihan Mendalam: Pembersihan area yang jarang terjangkau seperti kolong furnitur dan nat kamar mandi.",
      },
      {
        text:
          "• Pembersihan Pindahan: Pembersihan rumah kosong agar siap huni atau dikembalikan ke pemilik.",
      },
      {
        text:
          "• Pembersihan Pasca Renovasi: Menangani debu dan puing sisa renovasi seperti semen, serbuk kayu, dan cat.",
      },
    ],
  },
  {
    category: "Jasa",
    title: "Tukang Ledeng/Pipa",
    src: "/tukangledeng_pipa.jpg",
    sections: [
      {
        text:
          "• Instalasi Pipa Air Bersih & Air Buangan: Pemasangan jaringan pipa untuk air bersih dan pembuangan rumah tangga.",
      },
      {
        text:
          "• Perbaikan Kebocoran: Menangani pipa rembes, kran bocor, atau sumbatan saluran air.",
      },
      {
        text:
          "• Pelancaran Saluran Mampet: Mengatasi sumbatan dengan metode auger atau jetting tekanan tinggi.",
      },
      {
        text:
          "• Pemasangan & Penggantian Sanitary Fixture: Instalasi kloset, shower, wastafel, dan perbaikan komponen pipa.",
      },
      {
        text:
          "• Sistem Pemanas & Tekanan Air: Instalasi water heater, pompa, dan sistem tekanan air rumah tangga.",
      },
    ],
  },
  {
    category: "Jasa",
    title: "Tukang Sedot WC",
    src: "/tukangsedotwc.jpg",
    sections: [
      {
        text:
          "• Penyedotan Septictank & Lumpur Tinja: Menyedot dan membersihkan septictank dengan pemantauan kapasitas.",
      },
      {
        text:
          "• Pelancaran WC/Saluran Mampet: Menangani kloset yang meluap atau saluran yang tersumbat.",
      },
      {
        text:
          "• Inspeksi & Diagnostik: Memeriksa posisi dan kondisi septictank serta saluran pembuangan.",
      },
      {
        text:
          "• Perbaikan Komponen Tanki & Pipa: Memperbaiki retak atau kebocoran pada septictank dan saluran pembuangan.",
      },
      {
        text:
          "• Upgrade Sistem Sanitasi Rumah: Peningkatan sistem sanitasi dengan penambahan bio-septic atau sumur resapan.",
      },
    ],
  },
  {
    category: "Jasa",
    title: "Tukang Kebun",
    src: "/tukangkebun.jpg",
    sections: [
      {
        text:
          "• Perawatan Rutin Taman: Pemeliharaan taman dengan menyiram, memangkas, dan pemupukan.",
      },
      {
        text:
          "• Desain & Pembuatan Taman Baru: Desain taman sesuai tema dan kebutuhan, termasuk penanaman dan pemilihan material.",
      },
      {
        text:
          "• Pemangkasan & Peremajaan: Pemangkasan tanaman untuk kesehatan dan estetika taman.",
      },
      {
        text:
          "• Perawatan Rumput & Sistem Irigasi: Pemotongan dan perawatan rumput serta perbaikan sistem irigasi.",
      },
      {
        text:
          "• Pengendalian Hama & Penyakit Tanaman: Penanganan hama dan penyakit tanaman dengan metode alami dan pestisida selektif.",
      },
    ],
  },
  {
    category: "Jasa",
    title: "Tukang Mebel/Furnitur",
    src: "/tukangmebel_furnitur.jpg",
    sections: [
      {
        text:
          "• Pembuatan Furnitur Custom: Membuat perabot sesuai dengan kebutuhan dan ukuran rumah.",
      },
      {
        text:
          "• Perbaikan dan Restorasi Furnitur Lama: Memperbaiki furnitur yang rusak agar berfungsi kembali.",
      },
      {
        text:
          "• Bongkar Pasang Furnitur Modular: Membongkar dan merakit furnitur modular saat pindah tempat.",
      },
      {
        text:
          "• Desain & Produksi Furnitur Dekoratif: Pembuatan elemen dekoratif rumah seperti panel dinding atau rak display.",
      },
      {
        text:
          "• Finishing & Pemeliharaan Furnitur: Pelapisan dan pengecatan furnitur untuk menjaga keawetannya.",
      },
    ],
  },
];
