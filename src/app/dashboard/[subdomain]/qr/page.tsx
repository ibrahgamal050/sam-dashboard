'use client'

import { QRGenerator } from "@/components/qr-code-generator/qr-generator"
import { useParams } from 'next/navigation'

export default function QRPage() {
  const { subdomain } = useParams() as { subdomain: string }

  return <QRGenerator  subdomain={subdomain} />
}

