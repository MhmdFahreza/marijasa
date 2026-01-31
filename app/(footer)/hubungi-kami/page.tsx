"use client";

import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Mail, Phone, User, MessageSquare, Clock, Upload, X, ImagePlus } from 'lucide-react';

export default function ReportSystem() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadError, setUploadError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError('');

    if (file) {
      // Validasi tipe file
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setUploadError('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP');
        return;
      }

      // Validasi ukuran file (max 50KB)
      const maxSize = 50 * 1024; // 50 KB dalam bytes
      if (file.size > maxSize) {
        const fileSizeKB = (file.size / 1024).toFixed(2);
        setUploadError(`Ukuran file terlalu besar (${fileSizeKB} KB). Maksimal 50 KB untuk EmailJS`);
        // Reset input file
        const fileInput = document.getElementById('image-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        return;
      }

      setImageFile(file);
      
      // Buat preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setUploadError('');
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus('error');
      setErrorMessage('Mohon lengkapi semua field yang wajib diisi (*)');
      return;
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setStatus('error');
      setErrorMessage('Format email tidak valid');
      return;
    }

    // Double check ukuran gambar sebelum kirim
    if (imageFile && imageFile.size > 50 * 1024) {
      setStatus('error');
      setErrorMessage('Ukuran gambar melebihi 50 KB. Mohon gunakan gambar yang lebih kecil');
      return;
    }

    setStatus('sending');
    setErrorMessage('');

    try {
      const serviceID = 'service_4e0l7oi';
      const templateID = 'template_g22k46g';
      const publicKey = 'PLONDESMsYWCNwo0Q';

      // Format pesan - konversi line breaks ke HTML
      let messageHtml = formData.message.replace(/\n/g, '<br/>');

      // Jika ada gambar, embed sebagai base64 dalam HTML
      if (imageFile && imagePreview) {
        const imageHtml = `
          <div style="margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 12px; border: 2px solid #e5e7eb;">
            <p style="margin: 0 0 15px 0; font-weight: bold; color: #111827; font-size: 16px;">📎 Lampiran Gambar:</p>
            <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">
              <strong>Nama file:</strong> ${imageFile.name}<br/>
              <strong>Ukuran:</strong> ${(imageFile.size / 1024).toFixed(2)} KB
            </p>
            <div style="text-align: center; background-color: white; padding: 15px; border-radius: 8px;">
              <img src="${imagePreview}" alt="${imageFile.name}" style="max-width: 100%; max-height: 500px; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
            </div>
          </div>
        `;
        
        messageHtml = `${messageHtml}${imageHtml}`;
      }

      const templateParams = {
        name: formData.name,
        title: formData.subject,
        email: formData.email,
        message: messageHtml,
        phone: formData.phone || '-',
        from_name: formData.name,
        reply_to: formData.email
      };

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceID,
          template_id: templateID,
          user_id: publicKey,
          template_params: templateParams
        })
      });

      if (response.ok) {
        setStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
        removeImage();
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        const errorData = await response.text();
        console.error('EmailJS Error:', errorData);
        throw new Error('Gagal mengirim email');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Gagal mengirim laporan. Silakan coba lagi.');
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-tl from-cyan-200/20 to-emerald-200/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      
      <div className="relative z-10 px-4 py-8 md:px-6 md:py-12 lg:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12 lg:mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl md:rounded-3xl shadow-lg mb-4 md:mb-6 transform hover:scale-105 transition-transform">
              <Mail className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3 md:mb-4">
              Hubungi Kami
            </h1>
            <p className="text-gray-600 text-sm md:text-base lg:text-lg max-w-2xl mx-auto px-4">
              Kami siap membantu Anda! Kirimkan pesan dan kami akan merespons secepat mungkin.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Info Cards */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg p-5 md:p-6 border border-emerald-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-11 h-11 md:w-12 md:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-800 mb-1 text-sm md:text-base">Email</h3>
                    <p className="text-xs md:text-sm text-gray-600 break-all">muhammadfahreza0838@gmail.com</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg p-5 md:p-6 border border-emerald-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-11 h-11 md:w-12 md:h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1 text-sm md:text-base">Respon Cepat</h3>
                    <p className="text-xs md:text-sm text-gray-600">Kami akan membalas dalam 1x24 jam</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl md:rounded-2xl shadow-lg p-5 md:p-6 text-white">
                <h3 className="font-bold mb-2 text-sm md:text-base">Hubungi Kami</h3>
                <p className="text-xs md:text-sm text-emerald-50 leading-relaxed">
                  Sistem report dan feedback kami dirancang untuk memastikan setiap masukan Anda didengar dan ditindaklanjuti dengan serius. Kami berkomitmen untuk terus meningkatkan layanan demi kepuasan Anda.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-xl p-5 md:p-8 border border-emerald-100">
                <div className="space-y-4 md:space-y-6">
                  {/* Nama */}
                  <div>
                    <label htmlFor="name" className="text-xs md:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all outline-none bg-white"
                      placeholder="Masukkan nama lengkap Anda"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label htmlFor="email" className="text-xs md:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all outline-none bg-white"
                        placeholder="email@contoh.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="text-xs md:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                        Nomor Telepon
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all outline-none bg-white"
                        placeholder="08xx xxxx xxxx"
                      />
                    </div>
                  </div>

                  {/* Subjek */}
                  <div>
                    <label htmlFor="subject" className="text-xs md:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                      Subjek Pesan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all outline-none bg-white"
                      placeholder="Ringkasan pesan Anda"
                    />
                  </div>

                  {/* Pesan */}
                  <div>
                    <label htmlFor="message" className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                      Detail Pesan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all outline-none resize-none bg-white"
                      placeholder="Jelaskan pesan Anda secara detail..."
                    />
                  </div>

                  {/* Upload Gambar */}
                  <div>
                    <label className="text-xs md:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <ImagePlus className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                      Lampiran Gambar (Opsional)
                    </label>
                    
                    {!imagePreview ? (
                      <div className="relative">
                        <input
                          type="file"
                          id="image-upload"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="image-upload"
                          className="flex flex-col items-center justify-center w-full px-4 py-6 md:py-8 border-2 border-dashed border-gray-300 rounded-lg md:rounded-xl hover:border-emerald-400 hover:bg-emerald-50/50 transition-all cursor-pointer group"
                        >
                          <Upload className="w-8 h-8 md:w-10 md:h-10 text-gray-400 group-hover:text-emerald-500 transition-colors mb-2" />
                          <p className="text-xs md:text-sm text-gray-600 text-center">
                            <span className="font-semibold text-emerald-600">Klik untuk upload</span> atau drag & drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WebP (Maks. 50 KB)</p>
                        </label>
                      </div>
                    ) : (
                      <div className="relative rounded-lg md:rounded-xl overflow-hidden border-2 border-emerald-200 bg-gray-50">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 md:h-64 object-contain bg-gray-100"
                        />
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={removeImage}
                            type="button"
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg transition-colors"
                            title="Hapus gambar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="p-3 bg-white border-t border-gray-200">
                          <p className="text-xs md:text-sm text-gray-700 font-medium truncate">
                            📎 {imageFile?.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {imageFile && (imageFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {uploadError && (
                      <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 font-medium">{uploadError}</p>
                      </div>
                    )}
                    
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        💡 <strong>Tips:</strong> Untuk mengompres gambar, gunakan tools online seperti TinyPNG atau CompressJPEG agar ukuran di bawah 50 KB
                      </p>
                    </div>
                  </div>

                  {/* Status Messages */}
                  {status === 'success' && (
                    <div className="flex items-start gap-3 p-3 md:p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg md:rounded-xl">
                      <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-emerald-800 font-semibold text-sm md:text-base">Pesan Berhasil Dikirim!</p>
                        <p className="text-emerald-600 text-xs md:text-sm mt-0.5">Kami akan segera merespons ke email Anda.</p>
                      </div>
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="flex items-start gap-3 p-3 md:p-4 bg-red-50 border-2 border-red-200 rounded-lg md:rounded-xl">
                      <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-red-800 font-medium text-sm md:text-base">{errorMessage}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={status === 'sending'}
                    type="button"
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 md:py-4 px-6 rounded-lg md:rounded-xl flex items-center justify-center gap-2 md:gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] hover:shadow-lg disabled:hover:scale-100 disabled:cursor-not-allowed text-sm md:text-base"
                  >
                    {status === 'sending' ? (
                      <>
                        <div className="w-4 h-4 md:w-5 md:h-5 border-2 md:border-3 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mengirim Pesan...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 md:w-5 md:h-5" />
                        <span>Kirim Pesan {imageFile && '+ Lampiran'}</span>
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs md:text-sm text-gray-500 leading-relaxed px-2">
                    Dengan mengirim pesan, Anda menyetujui bahwa tim MARIJASA akan menghubungi Anda melalui email.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}