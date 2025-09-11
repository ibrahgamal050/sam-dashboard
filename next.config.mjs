/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      // إذا لم يكن التطبيق يعمل على الخادم، قم بتعديل إعدادات Webpack
      if (!isServer) {
        config.module.rules.push({
          test: /tesseract\.js$/, // تحديد تيسيراكت لاستخدام Web Worker
          use: [
            {
              loader: 'worker-loader',
              options: { inline: true },
            },
          ],
        });
      }
  
      return config;
    },
  };
  
  export default nextConfig;
  