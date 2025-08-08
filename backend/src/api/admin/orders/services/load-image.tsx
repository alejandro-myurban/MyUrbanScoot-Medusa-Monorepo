import sharp from "sharp";
import fileType from "file-type";

/**
 * @typedef {Object} ImageWithMime
 * @property {Buffer} buffer
 * @property {string} mime
 */
export type ImageWithMime = {
  buffer: Buffer;
  mime: string;
};

/**
 * @param {string | undefined} url - La URL de la imagen a cargar.
 * @param {boolean} [convertToPngIfUnsupported=false] - Si es true, convierte la imagen a PNG si no es JPEG o PNG.
 * @returns {Promise<ImageWithMime | null>} Un objeto con el buffer y el tipo MIME de la imagen, o null si falla.
 */
export async function loadImage(
  url: string | undefined,
  convertToPngIfUnsupported = false
): Promise<ImageWithMime | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    const buffer = Buffer.from(await res.arrayBuffer());
    let type = await fileType.fromBuffer(buffer);
    let imgBuffer = buffer;
    let mime = type?.mime || "image/png";

    if (
      convertToPngIfUnsupported &&
      mime !== "image/jpeg" &&
      mime !== "image/png"
    ) {
      console.warn(
        `Formato no soportado (${mime}) para ${url}, convirtiendo a PNG`
      );
      imgBuffer = (await sharp(buffer).png().toBuffer()) as Buffer;
      mime = "image/png";
    } else if (!type) {
      console.warn(
        `No se pudo detectar el tipo de imagen para ${url}, asumiendo PNG`
      );
      mime = "image/png";
    }
    return { buffer: imgBuffer, mime };
  } catch (error) {
    console.error(`Error cargando imagen desde ${url}:`, error);
    return null;
  }
}
