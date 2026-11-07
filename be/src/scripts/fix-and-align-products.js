import { prisma } from '../repositories/prisma.js';
import { vectorSearchService } from '../services/ai/vectorSearch.service.js';

/**
 * Danh sách chuẩn hóa toàn bộ 48 sản phẩm:
 * - Tên sản phẩm, mô tả, danh mục và màu sắc biến thể khớp 100% với hình ảnh thực tế.
 * - Màu sắc được quy chuẩn về màu cơ bản: Đen, Trắng, Xám, Xanh, Vàng, Đỏ, Hồng, Nâu, Be, Xanh lá.
 */
const PRODUCT_CORRECTIONS = [
  {
    id: 1,
    name: 'Áo Thun Oversize Unisex Màu Đen',
    cat: 'Áo thun',
    desc: 'Áo thun màu đen chất liệu 100% Cotton định lượng cao cấp, thoáng mát, phom dáng oversize dạo phố trẻ trung năng động.',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
    color: 'Đen',
  },
  {
    id: 2,
    name: 'Áo Sơ Mi Oxford Dài Tay Màu Trắng',
    cat: 'Áo sơ mi',
    desc: 'Áo sơ mi màu trắng tinh tế, chất liệu vải Oxford cao cấp chống nhăn, phom dáng hiện đại thanh lịch cho công sở và dạo phố.',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
    color: 'Trắng',
  },
  {
    id: 3,
    name: 'Quần Jeans Dáng Suông Màu Xanh',
    cat: 'Quần Jeans',
    desc: 'Quần jeans màu xanh denim cổ điển, chất liệu vải bò dày dặn bền đẹp, phom dáng suông thẳng tôn dáng và dễ phối đồ.',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',
    color: 'Xanh',
  },
  {
    id: 4,
    name: 'Áo Hoodie Nỉ Bông Có Mũ Màu Xám',
    cat: 'Áo Hoodie & Sweater',
    desc: 'Áo hoodie màu xám phong cách streetwear, chất liệu nỉ bông dày dặn ấm áp, có mũ trùm và túi khóa zip tiện lợi.',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800',
    color: 'Xám',
  },
  {
    id: 5,
    name: 'Áo Khoác Bomber Unisex Màu Đen',
    cat: 'Áo khoác & Jacket',
    desc: 'Áo khoác bomber màu đen phong cách thể thao khỏe khoắn, chất vải dù cao cấp chống gió và trượt nước tốt.',
    image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800',
    color: 'Đen',
  },
  {
    id: 7,
    name: 'Áo Thun Thể Thao Màu Đen',
    cat: 'Áo thun',
    desc: 'Áo thun thể thao màu đen chất liệu thun mè thể thao thoáng khí, co giãn tốt cho vận động.',
    image: 'https://res.cloudinary.com/dpjpdeql3/image/upload/v1789672398/youthfashion/products/x3mygtcqlcszwckdbrda.png',
    color: 'Đen',
  },
  {
    id: 10,
    name: 'Áo Hoodie Nỉ Trơn Màu Đen',
    cat: 'Áo Hoodie & Sweater',
    desc: 'Áo hoodie màu đen chất liệu nỉ bông ấm áp, phom rộng cá tính dạo phố phong cách đường phố.',
    image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800',
    color: 'Đen',
  },
  {
    id: 11,
    name: 'Áo Măng Tô Dạ Dáng Dài Màu Nâu',
    cat: 'Áo khoác & Jacket',
    desc: 'Áo măng tô dạ màu nâu dáng dài sang trọng, giữ ấm mùa đông tuyệt đối, đường may tinh xảo chuẩn phong cách Hàn Quốc.',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800',
    color: 'Nâu',
  },
  {
    id: 12,
    name: 'Váy Đầm Dạ Hội Lụa Satin Màu Đỏ',
    cat: 'Trang Phục Dạ Hội',
    desc: 'Đầm dạ hội màu đỏ quyến rũ chất liệu lụa satin cao cấp, thiết kế cổ chữ V xếp ly tôn dáng thanh lịch.',
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800',
    color: 'Đỏ',
  },
  {
    id: 13,
    name: 'Áo Khoác Dạ Dáng Dài Màu Be',
    cat: 'Áo khoác & Jacket',
    desc: 'Áo khoác dạ màu be thanh lịch, phom suông dài phong cách tối giản giữ ấm mùa thu đông hiệu quả.',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800',
    color: 'Be',
  },
  {
    id: 14,
    name: 'Áo Polo Nam Cổ Bẻ Màu Xanh Lá',
    cat: 'Áo Polo',
    desc: 'Áo polo màu xanh lá chất liệu dệt kim co giãn thoáng mát, cổ bẻ lịch sự cho nam giới.',
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800',
    color: 'Xanh lá',
  },
  {
    id: 15,
    name: 'Quần Short Kaki Túi Hộp Màu Vàng',
    cat: 'Quần Short',
    desc: 'Quần short màu vàng phong cách cargo túi hộp năng động, chất kaki dày dặn bền đẹp.',
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800',
    color: 'Vàng',
  },
  {
    id: 16,
    name: 'Quần Kaki Chino Slimfit Màu Đen',
    cat: 'Quần Kaki & Chino',
    desc: 'Quần kaki màu đen phom ôm vừa vặn, lịch sự, dễ phối cùng áo sơ mi và áo polo.',
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800',
    color: 'Đen',
  },
  {
    id: 17,
    name: 'Quần Tây Công Sở Xếp Ly Màu Xám',
    cat: 'Quần Tây & Trouser',
    desc: 'Quần tây màu xám cạp cao xếp ly, chất vải tuyết mưa đứng phom sang trọng.',
    image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800',
    color: 'Xám',
  },
  {
    id: 18,
    name: 'Quần Jogger Thể Thao Bo Gấu Màu Đen',
    cat: 'Quần Jogger & Thể thao',
    desc: 'Quần jogger thể thao màu đen bo gấu khỏe khoắn, chất thun nỉ co giãn thoải mái khi tập luyện.',
    image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800',
    color: 'Đen',
  },
  {
    id: 19,
    name: 'Chân Váy Xếp Ly Dáng Dài Màu Trắng',
    cat: 'Chân Váy',
    desc: 'Chân váy midi màu trắng xếp ly nhẹ nhàng, nữ tính, dễ dàng kết hợp cùng áo len hoặc sơ mi.',
    image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800',
    color: 'Trắng',
  },
  {
    id: 20,
    name: 'Áo Len Dệt Kim Cổ Lọ Màu Nâu',
    cat: 'Đồ Đông & Áo Len',
    desc: 'Áo len cổ lọ màu nâu ấm áp, sợi dệt mềm mại không xù lông, giữ ấm tối ưu cho ngày lạnh.',
    image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800',
    color: 'Nâu',
  },
  {
    id: 21,
    name: 'Áo Thun Unisex Loang Màu Xám',
    cat: 'Áo thun',
    desc: 'Áo thun màu xám hiệu ứng acid wash cá tính, chất cotton 100% thoáng mát phong cách dạo phố.',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
    color: 'Xám',
  },
  {
    id: 22,
    name: 'Áo Sơ Mi Vải Đũi Cổ Tàu Màu Trắng',
    cat: 'Áo sơ mi',
    desc: 'Áo sơ mi cổ tàu màu trắng chất liệu đũi linen tự nhiên, thấm hút mồ hôi và thoáng mát mùa hè.',
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800',
    color: 'Trắng',
  },
  {
    id: 23,
    name: 'Áo Sweater Nỉ Cổ Tròn Màu Xanh Lá',
    cat: 'Áo Hoodie & Sweater',
    desc: 'Áo sweater màu xanh lá chất liệu nỉ bông mềm mịn, in chữ typography tối giản năng động.',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800',
    color: 'Xanh lá',
  },
  {
    id: 24,
    name: 'Balo Vải Canvas Laptop Màu Nâu',
    cat: 'Túi Xách & Balo',
    desc: 'Balo màu nâu chất liệu vải canvas chống thấm nước, nhiều ngăn chứa laptop 15.6 inch tiện dụng.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    color: 'Nâu',
  },
  {
    id: 25,
    name: 'Túi Xách Nữ Da Pu Màu Đen',
    cat: 'Túi Xách & Balo',
    desc: 'Túi xách tay nữ màu đen chất da PU cao cấp, phom cứng cáp sang trọng phù hợp đi làm và dự tiệc.',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    color: 'Đen',
  },
  {
    id: 26,
    name: 'Giày Sneaker Thể Thao Cổ Thấp Màu Trắng',
    cat: 'Giày & Sandal',
    desc: 'Giày sneaker màu trắng thiết kế retro thể thao, đế cao su êm ái chống trơn trượt.',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
    color: 'Trắng',
  },
  {
    id: 27,
    name: 'Dép Sandal Da Quai Ngang Màu Nâu',
    cat: 'Giày & Sandal',
    desc: 'Sandal màu nâu đế trấu tự nhiên, quai da bền chắc êm chân khi di chuyển ngoài trời.',
    image: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800',
    color: 'Nâu',
  },
  {
    id: 28,
    name: 'Mũ Len Beanie Dệt Kim Màu Đen',
    cat: 'Mũ & Nón Thời Trang',
    desc: 'Mũ len beanie màu đen dệt kim co giãn, giữ ấm đầu phong cách tối giản.',
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800',
    color: 'Đen',
  },
  {
    id: 29,
    name: 'Mũ Lưỡi Trai Nón Kết Màu Xanh',
    cat: 'Mũ & Nón Thời Trang',
    desc: 'Nón lưỡi trai màu xanh chất liệu kaki cotton thoáng mát, thêu logo nổi bật.',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800',
    color: 'Xanh',
  },
  {
    id: 30,
    name: 'Thắt Lưng Da Nam Mặt Kim Màu Đen',
    cat: 'Thắt Lưng & Ví Da',
    desc: 'Thắt lưng nam màu đen chất da bò cao cấp, khóa kim kim loại chống gỉ tinh tế.',
    image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800',
    color: 'Đen',
  },
  {
    id: 31,
    name: 'Kính Mát Gọng Kim Loại Màu Vàng',
    cat: 'Kính Mát Thời Trang',
    desc: 'Kính râm thời trang gọng mạ màu vàng, tròng kính polarized chống lóa và chống tia UV400.',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800',
    color: 'Vàng',
  },
  {
    id: 32,
    name: 'Khăn Quàng Cổ Len Mùa Đông Màu Xám',
    cat: 'Khăn Quàng & Phụ Kiện',
    desc: 'Khăn quàng cổ màu xám chất liệu len cashmere mềm mại, giữ ấm cơ thể trong mùa đông giá lạnh.',
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800',
    color: 'Xám',
  },
  {
    id: 33,
    name: 'Bộ Đồ Tập Gym Yoga Nữ Màu Hồng',
    cat: 'Bộ Đồ Thể Thao',
    desc: 'Set đồ tập gym yoga nữ màu hồng gồm áo bra thể thao và quần legging co giãn 4 chiều.',
    image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800',
    color: 'Hồng',
  },
  {
    id: 34,
    name: 'Bộ Đồ Mặc Nhà Lụa Pyjama Màu Xanh',
    cat: 'Đồ Lót & Đồ Mặc Nhà',
    desc: 'Bộ pyjama mặc nhà màu xanh chất lụa satin bóng mượt, thoáng mát và mềm mại trên làn da.',
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800',
    color: 'Xanh',
  },
  {
    id: 35,
    name: 'Áo Khoác Denim Bò Cổ Bẻ Màu Xanh',
    cat: 'Áo khoác & Jacket',
    desc: 'Áo khoác bò denim màu xanh wash cổ điển, chất vải jean dày dặn phong cách bụi bặm.',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800',
    color: 'Xanh',
  },
  {
    id: 36,
    name: 'Đầm Dạ Hội Dáng Dài Màu Đen',
    cat: 'Trang Phục Dạ Hội',
    desc: 'Đầm dạ hội màu đen xẻ tà sang trọng, đính đá viền cổ nổi bật trong các buổi dạ tiệc.',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800',
    color: 'Đen',
  },
  {
    id: 37,
    name: 'Bộ Đồ Bơi Đi Biển 2 Mảnh Màu Vàng',
    cat: 'Đồ Bơi & Mùa Hè',
    desc: 'Bộ đồ bơi bikini 2 mảnh màu vàng tươi tắn, chất liệu thun bơi chống nước co giãn ôm dáng.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    color: 'Vàng',
  },
  {
    id: 38,
    name: 'Áo Sơ Mi Flannel Kẻ Caro Màu Đỏ',
    cat: 'Áo sơ mi',
    desc: 'Áo sơ mi flannel dạ kẻ caro màu đỏ phối đen, phom rộng phong cách grunge đường phố.',
    image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800',
    color: 'Đỏ',
  },
  {
    id: 39,
    name: 'Quần Jeans Rách Gối Màu Xanh',
    cat: 'Quần Jeans',
    desc: 'Quần jeans màu xanh nhạt rách gối cá tính, chất denim cao cấp chuẩn phong cách Hàn Quốc.',
    image: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800',
    color: 'Xanh',
  },
  {
    id: 40,
    name: 'Áo Gilet Len Không Tay Màu Trắng',
    cat: 'Áo Vest & Blazer',
    desc: 'Áo gilet len không tay màu trắng cổ tim, thích hợp phối layer cùng áo sơ mi phong cách preppy.',
    image: 'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=800',
    color: 'Trắng',
  },
  {
    id: 41,
    name: 'Áo Thun Ba Lỗ Ôm Dáng Màu Trắng',
    cat: 'Áo thun',
    desc: 'Áo thun ba lỗ màu trắng chất liệu vải tăm co giãn ôm dáng, thoáng mát và quyến rũ.',
    image: 'https://images.unsplash.com/photo-1627225924765-552d49cf47ad?w=800',
    color: 'Trắng',
  },
  {
    id: 42,
    name: 'Áo Thun Thể Thao In Họa Tiết Màu Đen',
    cat: 'Áo thun',
    desc: 'Áo thun thể thao màu đen in logo sắc nét, chất thun lạnh thấm hút mồ hôi tối ưu.',
    image: 'https://res.cloudinary.com/dpjpdeql3/image/upload/v1791886580/youthfashion/products/orqxrcz1ccnldzjesfvr.jpg',
    color: 'Đen',
  },
  {
    id: 43,
    name: 'Áo Khoác Dạ Dáng Dài Màu Nâu',
    cat: 'Áo khoác & Jacket',
    desc: 'Áo măng tô dạ màu nâu cổ bẻ dáng dài, chất liệu len pha dạ ấm áp, thanh lịch cho mùa đông.',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1000',
    color: 'Nâu',
  },
  {
    id: 44,
    name: 'Áo Len Cổ Lọ Dệt Kim Màu Trắng',
    cat: 'Đồ Đông & Áo Len',
    desc: 'Áo len dệt kim màu trắng kem cổ lọ cao, giữ ấm tuyệt đối và dễ phối cùng chân váy hay quần tây.',
    image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&q=80&w=800',
    color: 'Trắng',
  },
  {
    id: 45,
    name: 'Quần Âu Nam Ống Suông Màu Xám',
    cat: 'Quần Tây & Trouser',
    desc: 'Quần âu nam màu xám ống suông chất vải tuyết mưa đứng dáng, cạp may tỉ mỉ sang trọng.',
    image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&q=80&w=800',
    color: 'Xám',
  },
  {
    id: 46,
    name: 'Đầm Lụa Dạ Hội Xếp Ly Màu Đỏ',
    cat: 'Trang Phục Dạ Hội',
    desc: 'Đầm lụa dạ tiệc màu đỏ xếp ly quý phái, chất liệu satin bóng bẩy tôn vinh vẻ đẹp kiêu sa.',
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=1000',
    color: 'Đỏ',
  },
  {
    id: 47,
    name: 'Áo Sơ Mi Oxford Nam Màu Xanh',
    cat: 'Áo sơ mi',
    desc: 'Áo sơ mi nam màu xanh chất liệu cotton Oxford bền đẹp, phom dáng regular fit lịch lãm.',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800',
    color: 'Xanh',
  },
  {
    id: 48,
    name: 'Quần Tây Công Sở Nam Màu Đen',
    cat: 'Quần Tây & Trouser',
    desc: 'Quần tây màu đen phom đứng dáng thanh lịch, cạp êm ái thích hợp cho môi trường văn phòng.',
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800',
    color: 'Đen',
  },
  {
    id: 49,
    name: 'Bộ Đồ Nỉ Hoodie Thể Thao Màu Vàng',
    cat: 'Bộ Đồ Thể Thao',
    desc: 'Set bộ nỉ hoodie dáng croptop kèm quần jogger màu vàng tươi trẻ trung, năng động, phong cách thời trang thể thao đường phố streetwear.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
    color: 'Vàng',
  },
  {
    id: 50,
    name: 'Áo Sơ Mi Poplin Dài Tay Màu Trắng',
    cat: 'Áo sơ mi',
    desc: 'Áo sơ mi màu trắng chất liệu poplin cotton thoáng khí, chống nhăn, phom dáng chuẩn mực công sở.',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
    color: 'Trắng',
  },
  {
    id: 51,
    name: 'Giày Sneaker Cổ Điển Màu Trắng',
    cat: 'Giày & Sandal',
    desc: 'Giày sneaker thể thao màu trắng phom dáng cổ điển retro, lót giày êm ái chống sốc tốt.',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
    color: 'Trắng',
  },
];

async function alignProducts() {
  console.log('=== [TIẾN HÀNH CHUẨN HÓA SẢN PHẨM: ẢNH - TÊN - MÔ TẢ - MÀU CƠ BẢN] ===\n');

  // Lấy toàn bộ danh mục để map id
  const categories = await prisma.category.findMany();
  const catMap = new Map(categories.map((c) => [c.category_name, c.category_id]));

  let updatedCount = 0;

  for (const item of PRODUCT_CORRECTIONS) {
    const productId = BigInt(item.id);

    // Tìm sản phẩm trong DB
    const existing = await prisma.product.findUnique({
      where: { product_id: productId },
      include: { images: true, variants: true },
    });

    if (!existing) {
      console.warn(`[Skip] Không tìm thấy sản phẩm ID ${item.id}`);
      continue;
    }

    const categoryId = catMap.get(item.cat) || existing.category_id;

    // 1. Cập nhật thông tin cơ bản: Tên, Mô tả, Danh mục
    await prisma.product.update({
      where: { product_id: productId },
      data: {
        product_name: item.name,
        description: item.desc,
        category_id: categoryId,
      },
    });

    // 2. Cập nhật hình ảnh chính
    if (existing.images && existing.images.length > 0) {
      const primaryImage = existing.images.find((img) => img.is_primary) || existing.images[0];
      await prisma.productImage.update({
        where: { image_id: primaryImage.image_id },
        data: {
          image_url: item.image,
          alt_text: item.name,
        },
      });
    } else {
      await prisma.productImage.create({
        data: {
          product_id: productId,
          image_url: item.image,
          alt_text: item.name,
          is_primary: true,
          display_order: 1,
        },
      });
    }

    // 3. Chuẩn hóa các biến thể (variants) của sản phẩm, tránh xung đột unique (product_id, size, color)
    const variants = await prisma.productVariant.findMany({
      where: { product_id: productId },
    });

    // Nhóm theo size
    const sizeGroups = {};
    for (const v of variants) {
      const s = v.size.trim().toUpperCase();
      if (!sizeGroups[s]) sizeGroups[s] = [];
      sizeGroups[s].push(v);
    }

    for (const [sizeStr, group] of Object.entries(sizeGroups)) {
      // Ưu tiên giữ lại variant đã có sẵn màu item.color, nếu không lấy cái đầu tiên
      const toKeep = group.find((v) => v.color.toLowerCase() === item.color.toLowerCase()) || group[0];
      const toDelete = group.filter((v) => v.variant_id !== toKeep.variant_id);

      // Xóa các biến thể trùng size
      for (const delV of toDelete) {
        try {
          await prisma.productVariant.delete({
            where: { variant_id: delV.variant_id },
          });
        } catch (delErr) {
          console.warn(`[Variant Del] Không thể xóa variant ${delV.variant_id}:`, delErr.message);
        }
      }

      // Cập nhật variant được giữ lại về màu cơ bản chuẩn
      await prisma.productVariant.update({
        where: { variant_id: toKeep.variant_id },
        data: { color: item.color },
      });
    }

    updatedCount++;
    console.log(`✅ [ID ${item.id}] "${item.name}" | Danh mục: ${item.cat} | Màu: ${item.color}`);
  }

  console.log(`\n🎉 Đã chuẩn hóa thành công ${updatedCount} sản phẩm trong MySQL!`);

  // 4. Đồng bộ lại Vector Embedding cho AI Search
  console.log('\n--- ĐỒNG BỘ LẠI VECTOR EMBEDDINGS CHO AI SEARCH VỚI DỮ LIỆU MỚI ---');
  vectorSearchService.vectorsCache = [];
  const summary = await vectorSearchService.syncCatalogEmbeddings((p) => {
    process.stdout.write(`Đang nạp vector: ${p.current}/${p.total} (${p.product_name})\r`);
  });

  console.log('\n✅ Hoàn tất đồng bộ Vector AI Search:', summary);
}

alignProducts()
  .catch((err) => {
    console.error('Lỗi chuẩn hóa sản phẩm:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
