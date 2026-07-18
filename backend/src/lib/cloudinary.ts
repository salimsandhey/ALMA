import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

export async function uploadAvatar(fileBuffer: Buffer, userId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'alma/avatars', public_id: userId, overwrite: true, resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'))
        resolve(result.secure_url)
      }
    )
    stream.end(fileBuffer)
  })
}

export async function uploadLessonImage(fileBuffer: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'alma/lessons', public_id: publicId, overwrite: true, resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'))
        resolve(result.secure_url)
      }
    )
    stream.end(fileBuffer)
  })
}

export async function uploadBgMusic(fileBuffer: Buffer, songId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'alma/karaoke-bg', public_id: `song_${songId}`, overwrite: true, resource_type: 'video' },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'))
        resolve(result.secure_url)
      }
    )
    stream.end(fileBuffer)
  })
}

export async function uploadDefaultBgMusic(fileBuffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'alma/karaoke-bg', public_id: 'default', overwrite: true, resource_type: 'video', invalidate: true },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'))
        resolve(result.secure_url)
      }
    )
    stream.end(fileBuffer)
  })
}

export default cloudinary
