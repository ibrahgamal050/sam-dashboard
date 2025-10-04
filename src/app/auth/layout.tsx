import Link from "next/link"
import type { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f3ff]" dir="rtl">
      <div className="grid min-h-screen lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#6c5ce7] via-[#8a7ff5] to-[#6c5ce7] lg:flex">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center opacity-20" />
          <div className="relative z-10 flex w-full flex-col justify-between px-16 py-12 text-white">
            <header className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold tracking-tight">
                Meelza Platform
              </Link>
              <span className="rounded-full bg-white/15 px-4 py-1 text-sm font-medium">حل متكامل للمطاعم</span>
            </header>

            <div className="space-y-6 text-right">
              <p className="text-sm uppercase tracking-[0.3em] text-white/70">إدارة احترافية</p>
              <h2 className="text-4xl font-semibold leading-tight">
                صمّم تجربتك الرقمية وادمج طلبات الدليفري في منصة واحدة مترابطة
              </h2>
              <p className="max-w-md text-base text-white/80">
                لوحة تحكم ذكية، قوالب قابلة للتخصيص، وتكاملات مدفوعة بالذكاء الاصطناعي تمنح فريقك السرعة والمرونة.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-white/80">
              <div className="flex items-center justify-between">
                <span>دعم متعدد الفروع والقنوات</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">Pro</span>
              </div>
              <div className="flex items-center justify-between">
                <span>لوحة تحليلات في الوقت الحقيقي</span>
                <span>•</span>
              </div>
              <div className="flex items-center justify-between">
                <span>إدارة قوائم ذكية وتحديثات فورية</span>
                <span>•</span>
              </div>
            </div>

            <footer className="text-xs text-white/60">
              © {new Date().getFullYear()} Meelza. جميع الحقوق محفوظة.
            </footer>
          </div>
        </aside>

        <main className="flex min-h-screen flex-col justify-center bg-white lg:rounded-l-[36px] lg:shadow-[0 30px 80px -40px rgba(108,92,231,0.35)]">
          <div className="mx-auto w-full max-w-lg px-6 py-12 sm:px-12">
            <div className="mb-10 flex items-center justify-between lg:hidden">
              <Link href="/" className="text-xl font-semibold text-gray-900">
                Meelza Platform
              </Link>
              <span className="rounded-full bg-[#6c5ce7]/10 px-3 py-1 text-xs font-semibold text-[#6c5ce7]">
                إدارة المطاعم
              </span>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
