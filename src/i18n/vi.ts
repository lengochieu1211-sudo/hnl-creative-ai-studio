const exact: Record<string,string> = {
  'Studio Editor':'Trình biên tập','AI Video':'Video AI','Virtual Try-On':'Thử trang phục AI','Product AI':'AI sản phẩm','Templates & Menu':'Mẫu thiết kế & Menu','Docs to Video':'Tài liệu → Video','Brand Kit':'Bộ nhận diện','AI Settings':'Cài đặt AI','Golden Tests':'Kiểm thử Golden','Export':'Xuất file',
  'Undo':'Hoàn tác','Redo':'Làm lại','Undo (Ctrl+Z)':'Hoàn tác (Ctrl+Z)','Redo (Ctrl+Y)':'Làm lại (Ctrl+Y)','Open modules':'Mở mô-đun','Close modules':'Đóng mô-đun','Modules':'Mô-đun','AI Command Bar':'Thanh lệnh AI','HNL Creative AI modules':'Các mô-đun HNL Creative AI','Execute':'Thực hiện','Quick Commands:':'Lệnh nhanh:',
  'Assets':'Tài nguyên','AI Director':'Đạo diễn AI','Images':'Hình ảnh','Videos':'Video','Audio':'Âm thanh','Docs/Excel':'Tài liệu/Excel','AI Generated':'Do AI tạo','Favorites':'Yêu thích','Upload Media & Documents':'Tải ảnh, video, âm thanh & tài liệu','No assets in this category.':'Chưa có tài nguyên trong nhóm này.','Drag and drop files here to upload.':'Kéo thả file vào đây để tải lên.','Search assets, tags, text...':'Tìm tài nguyên, thẻ, nội dung...',
  'Text':'Văn bản','Shape':'Hình khối','Duplicate':'Nhân bản','Flip Horizontal':'Lật ngang','Delete':'Xóa','Layers & properties':'Lớp & thuộc tính','Close inspector':'Đóng bảng thuộc tính','Rotate':'Xoay','Brightness':'Độ sáng','Contrast':'Tương phản','Saturation':'Độ bão hòa','Blur':'Làm mờ','Grayscale':'Thang xám','Sepia':'Màu nâu cổ điển','Font Size':'Cỡ chữ','Reset':'Đặt lại','Select an element to edit properties.':'Chọn một đối tượng để chỉnh thuộc tính.',
  'AI Connection & BYOK':'Kết nối AI & BYOK','Gemini API Key':'Gemini API Key','Remember only in this browser (localStorage). API keys are never stored in project.json or backup ZIP.':'Chỉ ghi nhớ trên trình duyệt này (localStorage). API key không bao giờ được lưu trong project.json hoặc ZIP sao lưu.','Save':'Lưu','Test Connection':'Kiểm tra kết nối','Clear':'Xóa','Verified Capability Registry':'Danh sách khả năng AI đã xác minh',
  'AI Creative Director':'Đạo diễn sáng tạo AI','Storyboard-First Multimodal Agent':'AI đa phương thức ưu tiên kịch bản phân cảnh','Target Duration':'Thời lượng mục tiêu','Aspect Ratio':'Tỷ lệ khung hình','Applied':'Đã áp dụng','User Asset':'Tài nguyên người dùng','AI Prompt':'Yêu cầu AI','Generate Storyboard':'Tạo kịch bản phân cảnh','Sync to Timeline':'Đồng bộ sang Timeline','Approve Storyboard':'Duyệt kịch bản phân cảnh','Draft':'Bản nháp','Missing Media':'Thiếu tài nguyên',
  'Virtual Fashion & Try-On Studio':'Studio thời trang & thử trang phục AI','Selected':'Đã chọn','Preserve Face & Identity':'Giữ khuôn mặt & danh tính','Preserve Hairstyle':'Giữ kiểu tóc','Preserve Body Pose':'Giữ tư thế cơ thể','Original Model':'Ảnh người mẫu gốc','Original':'Bản gốc','Generated Try-On':'Kết quả thử trang phục AI','Generate Try-On':'Tạo thử trang phục','Apply to Canvas':'Đưa vào Canvas',
  'Product AI Commercial Studio':'Studio quảng cáo sản phẩm AI','Clean White Studio':'Studio nền trắng sạch','Luxury Dark Marble':'Đá cẩm thạch tối sang trọng','Cozy Cafe Table':'Bàn cà phê ấm cúng','Fine Dining Restaurant':'Nhà hàng cao cấp','Nature & Sunlight':'Thiên nhiên & ánh nắng','Futuristic Tech Lab':'Phòng công nghệ tương lai','Product Commercial Result':'Kết quả quảng cáo sản phẩm','Generate Product Photo':'Tạo ảnh sản phẩm',
  'Multi-Page Design & Template Studio':'Studio thiết kế nhiều trang & mẫu','Restaurant Menu':'Menu nhà hàng','Product Catalogue':'Catalogue sản phẩm','VIP Invitation':'Thiệp mời VIP','Poster & Social':'Poster & mạng xã hội','Apply Template':'Áp dụng mẫu',
  'Export & Project Delivery':'Xuất file & bàn giao dự án','Output':'Đầu ra','Video':'Video','Image':'Hình ảnh','PDF':'PDF','Backup':'Sao lưu','Multi-page design PDF':'PDF thiết kế nhiều trang','Project + original assets':'Dự án + tài nguyên gốc','Exporting...':'Đang xuất...','Start Export':'Bắt đầu xuất','WebM export is unavailable in this browser.':'Trình duyệt này không hỗ trợ xuất WebM.','Split':'Cắt tại vị trí','Drag clip • drag edges to trim • vertical drag moves compatible tracks':'Kéo clip để di chuyển • kéo hai mép để cắt • kéo dọc để chuyển sang track tương thích',
  'Golden Integration Diagnostics':'Chẩn đoán tích hợp Golden','Run 8 Diagnostics':'Chạy 8 kiểm tra','Runtime summary':'Tổng kết runtime','Run diagnostics after uploading representative image/video/document files.':'Hãy tải lên ảnh/video/tài liệu mẫu rồi chạy chẩn đoán.',
  'Document to Video':'Tài liệu → Video','Select Excel Spreadsheet or PDF Document':'Chọn Excel, PDF hoặc tài liệu','Generate Storyboard from Document':'Tạo kịch bản video từ tài liệu','Parse Document':'Đọc tài liệu',
  'AI Video Studio':'Studio Video AI','Generate Video':'Tạo video','Save Generated Video to Asset Library & Timeline':'Lưu video AI vào Thư viện tài nguyên & Timeline','Prompt':'Yêu cầu','Reference Image':'Ảnh tham chiếu','Existing Video':'Video có sẵn','Model':'Mô hình','Mode':'Chế độ','Generate':'Tạo','Result':'Kết quả',
  'Universal Brand Kit':'Bộ nhận diện dùng chung','Brand Identity':'Nhận diện thương hiệu','Brand / Business Name':'Tên thương hiệu / doanh nghiệp','Primary Color':'Màu chính','Secondary':'Màu phụ','Accent':'Màu nhấn','Contact & Digital Footprint':'Liên hệ & thông tin trực tuyến','Save & Apply Brand Kit to Project':'Lưu & áp dụng bộ nhận diện cho dự án'
};

const fragments: Array<[string,string]> = [
  ['Type an AI command','Nhập lệnh AI'],['Please select','Vui lòng chọn'],['Failed to','Không thể'],['Generation Error','Lỗi tạo nội dung'],['Product Studio Error','Lỗi AI sản phẩm'],['Try-On Generation Error','Lỗi tạo thử trang phục AI'],['Parsing error','Lỗi đọc tài liệu'],['Storyboard extraction error','Lỗi tạo kịch bản phân cảnh'],['No API key configured','Chưa cấu hình API key'],['Connection failed','Kết nối thất bại'],['Connection successful','Kết nối thành công'],['Selected','Đã chọn'],['Original','Bản gốc'],['Generated','Đã tạo'],['Upload','Tải lên'],['Download','Tải xuống'],['Search','Tìm kiếm'],['Settings','Cài đặt'],['Properties','Thuộc tính'],['Layers','Lớp'],['Timeline','Timeline'],['Storyboard','Kịch bản phân cảnh']
];

function translate(value:string){
  const t=value.trim();
  if(!t) return value;
  const direct=exact[t];
  if(direct) return value.replace(t,direct);
  let out=value;
  for(const [a,b] of fragments) if(out.includes(a)) out=out.replaceAll(a,b);
  return out;
}

function translateElement(el:Element){
  for(const attr of ['placeholder','title','aria-label']){
    const value=el.getAttribute(attr); if(value){const next=translate(value); if(next!==value)el.setAttribute(attr,next);}
  }
  for(const node of Array.from(el.childNodes)){
    if(node.nodeType===Node.TEXT_NODE && node.textContent){const next=translate(node.textContent);if(next!==node.textContent)node.textContent=next;}
  }
}

function walk(root:Node){
  if(root.nodeType===Node.ELEMENT_NODE){const el=root as Element;translateElement(el);for(const child of Array.from(el.children))walk(child);}
}

export function enableVietnameseUI(){
  document.documentElement.lang='vi';
  document.title='HNL Creative AI Studio - Studio sáng tạo AI đa phương tiện';
  const apply=()=>{if(document.body)walk(document.body);};
  apply();
  const observer=new MutationObserver(records=>{for(const r of records){for(const n of Array.from(r.addedNodes))walk(n);if(r.type==='characterData'&&r.target.parentElement)translateElement(r.target.parentElement);}});
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  return()=>observer.disconnect();
}
