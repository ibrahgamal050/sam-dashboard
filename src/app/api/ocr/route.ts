import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';

declare module 'tesseract.js' {
  export interface Worker {
    load(): Promise<void>;
    loadLanguage(lang: string): Promise<void>;
    reinitialize(lang: string): Promise<void>;
    recognize(image: Buffer | string): Promise<{ data: { text: string } }>;
    terminate(): Promise<void>;
  }

  export function createWorker(): Promise<Worker>;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const imageBuffer = await file.arrayBuffer();

    const worker = await createWorker();
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.reinitialize('eng');

    const { data: { text } } = await worker.recognize(Buffer.from(imageBuffer));

    // طباعة النص المستخرج في الكونسول
    console.log('Extracted Text:', text);

    await worker.terminate();

    return NextResponse.json({ text });
  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: 'Error processing image' }, { status: 500 });
  }
}
