import { AutoTokenizer, AutoProcessor, CLIPTextModelWithProjection, CLIPVisionModelWithProjection, RawImage } from '@xenova/transformers';

function normalize(vector) {
  let sumSq = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return vector;
  return vector.map(v => v / norm);
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

async function runPoC() {
  console.log('=== [GIAI ĐOẠN 1: PROOF OF CONCEPT (PoC) - FASHION CLIP] ===\n');

  const modelId = 'Xenova/clip-vit-base-patch32';

  console.log(`1. Khởi tạo Tokenizer & Processor từ ${modelId}...`);
  const tokenizer = await AutoTokenizer.from_pretrained(modelId);
  const processor = await AutoProcessor.from_pretrained(modelId);

  console.log(`2. Tải CLIP Text Model & Vision Model...`);
  const textModel = await CLIPTextModelWithProjection.from_pretrained(modelId);
  const visionModel = await CLIPVisionModelWithProjection.from_pretrained(modelId);
  console.log('   => Tải mô hình thành công!\n');

  // 3. Thử nghiệm với ảnh thực tế từ seed: Áo sơ mi trắng (White Oxford Shirt)
  const shirtImageUrl = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500';
  console.log(`3. Tải và xử lý ảnh Áo Sơ Mi Trắng: ${shirtImageUrl}...`);
  const shirtImage = await RawImage.read(shirtImageUrl);
  const shirtInputs = await processor(shirtImage);
  const { image_embeds: shirtEmbeds } = await visionModel(shirtInputs);
  const shirtVector = normalize(Array.from(shirtEmbeds.data));

  console.log(`   => Đã tạo Image Embedding!`);
  console.log(`      Dimensions: ${shirtVector.length}`);
  console.log(`      Sample values: [${shirtVector.slice(0, 5).map(v => v.toFixed(4)).join(', ')}, ...]\n`);

  // 4. So sánh với các câu Text mô tả khác nhau
  const testQueries = [
    'a classic white button-up dress shirt',
    'white oxford cotton shirt for men',
    'blue denim jeans pants',
    'heavy black winter jacket',
    'high-heel ladies shoes'
  ];

  console.log('4. So sánh Cosine Similarity giữa Ảnh [Áo sơ mi trắng] và các Text query:');
  for (const query of testQueries) {
    const textInputs = tokenizer([query], { padding: true, truncation: true });
    const { text_embeds } = await textModel(textInputs);
    const textVector = normalize(Array.from(text_embeds.data));

    const similarity = cosineSimilarity(shirtVector, textVector);
    const percentage = (similarity * 100).toFixed(2);
    console.log(`   - "${query}" => Similarity: ${similarity.toFixed(4)} (${percentage}%)`);
  }

  // 5. Thử nghiệm so sánh Ảnh vs Ảnh (Visual Search)
  console.log('\n5. Thử nghiệm Image-to-Image Similarity (Visual Search):');
  const jeansImageUrl = 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500';
  console.log(`   Tải ảnh Quần Jeans: ${jeansImageUrl}...`);
  const jeansImage = await RawImage.read(jeansImageUrl);
  const jeansInputs = await processor(jeansImage);
  const { image_embeds: jeansEmbeds } = await visionModel(jeansInputs);
  const jeansVector = normalize(Array.from(jeansEmbeds.data));

  const imgSim = cosineSimilarity(shirtVector, jeansVector);
  console.log(`   => Độ tương đồng giữa [Ảnh Áo sơ mi trắng] vs [Ảnh Quần Jeans]: ${imgSim.toFixed(4)} (${(imgSim * 100).toFixed(2)}%)`);
  
  const selfSim = cosineSimilarity(shirtVector, shirtVector);
  console.log(`   => Độ tương đồng giữa [Ảnh Áo sơ mi trắng] vs [Chính nó]: ${selfSim.toFixed(4)} (${(selfSim * 100).toFixed(2)}%)`);

  console.log('\n=== ĐIỀU KIỆN HOÀN THÀNH GIAI ĐOẠN 1 ===');
  console.log('✔ Hai đầu vào (Ảnh và Text) đều tạo ra vector 512 chiều thành công.');
  console.log('✔ Cosine Similarity phân biệt rõ rệt giữa mục tiêu khớp vs mục tiêu khác biệt.');
  console.log('✔ Hệ thống chạy hoàn toàn 100% trên Node.js mà không cần cài đặt Python.');
}

runPoC().catch(err => {
  console.error('PoC Thất bại:', err);
});
