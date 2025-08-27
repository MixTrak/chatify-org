import { NextRequest, NextResponse } from 'next/server';
import { getGridFSBucket } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    
    if (!ObjectId.isValid(id)) {
      return new NextResponse('Invalid image ID', { status: 400 });
    }

    const bucket = await getGridFSBucket();
    const downloadStream = bucket.openDownloadStream(new ObjectId(id));
    
    const chunks: Buffer[] = [];
    
    return new Promise<NextResponse>((resolve) => {
      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const response = new NextResponse(buffer);
        response.headers.set('Content-Type', 'image/jpeg');
        response.headers.set('Cache-Control', 'public, max-age=31536000');
        resolve(response);
      });
      
      downloadStream.on('error', () => {
        resolve(new NextResponse('Image not found', { status: 404 }));
      });
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
