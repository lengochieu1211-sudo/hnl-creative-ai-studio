export type Locale = 'vi' | 'en';

const STORAGE_KEY = 'hnl_locale';
const TOGGLE_ID = 'hnl-locale-toggle';
const STYLE_ID = 'hnl-locale-style';

const exact: Record<string, string> = {
  'Studio Editor': 'Trình biên tập', 'AI Video': 'Video AI', 'Virtual Try-On': 'Thử trang phục AI', 'Product AI': 'AI sản phẩm', 'Templates & Menu': 'Mẫu thiết kế & Menu', 'Docs to Video': 'Tài liệu → Video', 'Brand Kit': 'Bộ nhận diện', 'AI Settings': 'Cài đặt AI', 'Golden Tests': 'Kiểm thử Golden', 'Export': 'Xuất file',
  'Undo': 'Hoàn tác', 'Redo': 'Làm lại', 'Undo (Ctrl+Z)': 'Hoàn tác (Ctrl+Z)', 'Redo (Ctrl+Y)': 'Làm lại (Ctrl+Y)', 'Open modules': 'Mở mô-đun', 'Close modules': 'Đóng mô-đun', 'Modules': 'Mô-đun', 'AI Command Bar': 'Thanh lệnh AI', 'HNL Creative AI modules': 'Các mô-đun HNL Creative AI', 'Execute': 'Thực hiện', 'Quick Commands:': 'Lệnh nhanh:',
  'Assets': 'Tài nguyên', 'AI Director': 'Đạo diễn AI', 'Images': 'Hình ảnh', 'Videos': 'Video', 'Audio': 'Âm thanh', 'Docs/Excel': 'Tài liệu/Excel', 'AI Generated': 'Do AI tạo', 'Favorites': 'Yêu thích', 'Upload Media & Documents': 'Tải ảnh, video, âm thanh & tài liệu', 'No assets in this category.': 'Chưa có tài nguyên trong nhóm này.', 'Drag and drop files here to upload.': 'Kéo thả file vào đây để tải lên.', 'Search assets, tags, text...': 'Tìm tài nguyên, thẻ, nội dung...',
  'Text': 'Văn bản', 'Shape': 'Hình khối', 'Duplicate': 'Nhân bản', 'Flip Horizontal': 'Lật ngang', 'Delete': 'Xóa', 'Layers & properties': 'Lớp & thuộc tính', 'Close inspector': 'Đóng bảng thuộc tính', 'Rotate': 'Xoay', 'Brightness': 'Độ sáng', 'Contrast': 'Tương phản', 'Saturation': 'Độ bão hòa', 'Blur': 'Làm mờ', 'Grayscale': 'Thang xám', 'Sepia': 'Nâu cổ điển', 'Font Size': 'Cỡ chữ', 'Reset': 'Đặt lại', 'Select an element to edit properties.': 'Chọn một đối tượng để chỉnh thuộc tính.',
  'AI Connection & BYOK': 'Kết nối AI & BYOK', 'Gemini API Key': 'Gemini API Key', 'Save': 'Lưu', 'Test Connection': 'Kiểm tra kết nối', 'Clear': 'Xóa', 'Verified Capability Registry': 'Danh sách khả năng AI đã xác minh',
  'AI Creative Director': 'Đạo diễn sáng tạo AI', 'Storyboard-First Multimodal Agent': 'AI đa phương thức ưu tiên phân cảnh', 'Target Duration': 'Thời lượng mục tiêu', 'Aspect Ratio': 'Tỷ lệ khung hình', 'Applied': 'Đã áp dụng', 'User Asset': 'Tài nguyên người dùng', 'AI Prompt': 'Yêu cầu AI', 'Generate Storyboard': 'Tạo kịch bản phân cảnh', 'Sync to Timeline': 'Đồng bộ sang Timeline', 'Approve Storyboard': 'Duyệt kịch bản phân cảnh', 'Draft': 'Bản nháp', 'Missing Media': 'Thiếu tài nguyên',
  'Virtual Fashion & Try-On Studio': 'Studio thời trang & thử trang phục AI', 'Selected': 'Đã chọn', 'Preserve Face & Identity': 'Giữ khuôn mặt & danh tính', 'Preserve Hairstyle': 'Giữ kiểu tóc', 'Preserve Body Pose': 'Giữ tư thế cơ thể', 'Original Model': 'Ảnh người mẫu gốc', 'Original': 'Bản gốc', 'Generated Try-On': 'Kết quả thử trang phục AI', 'Generate Virtual Try-On': 'Tạo thử trang phục AI', 'Apply to Canvas': 'Đưa vào Canvas',
  'Product AI Commercial Studio': 'Studio quảng cáo sản phẩm AI', 'Clean White Studio': 'Studio nền trắng sạch', 'Luxury Dark Marble': 'Đá cẩm thạch tối sang trọng', 'Cozy Cafe Table': 'Bàn cà phê ấm cúng', 'Fine Dining Restaurant': 'Nhà hàng cao cấp', 'Nature & Sunlight': 'Thiên nhiên & ánh nắng', 'Futuristic Tech Lab': 'Phòng công nghệ tương lai', 'Product Commercial Result': 'Kết quả quảng cáo sản phẩm', 'Generate Product Photo': 'Tạo ảnh sản phẩm',
  'Multi-Page Design & Template Studio': 'Studio thiết kế nhiều trang & mẫu', 'Restaurant Menu': 'Menu nhà hàng', 'Product Catalogue': 'Catalogue sản phẩm', 'VIP Invitation': 'Thiệp mời VIP', 'Poster & Social': 'Poster & mạng xã hội', 'Apply Template': 'Áp dụng mẫu',
  'Export & Project Delivery': 'Xuất file & bàn giao dự án', 'Output': 'Đầu ra', 'Image': 'Hình ảnh', 'PDF': 'PDF', 'Backup': 'Sao lưu', 'Multi-page design PDF': 'PDF thiết kế nhiều trang', 'Project + original assets': 'Dự án + tài nguyên gốc', 'Exporting...': 'Đang xuất...', 'Start Export': 'Bắt đầu xuất',
  'Golden Integration Diagnostics': 'Chẩn đoán tích hợp Golden', 'Run 8 Diagnostics': 'Chạy 8 kiểm tra', 'Runtime summary': 'Tổng kết runtime',
  'Document to Video': 'Tài liệu → Video', 'Select Excel Spreadsheet or PDF Document': 'Chọn Excel, PDF hoặc tài liệu', 'Generate Storyboard from Document': 'Tạo kịch bản video từ tài liệu', 'Parse Document': 'Đọc tài liệu',
  'AI Video Studio': 'Studio Video AI', 'Generate Video': 'Tạo video', 'Save Generated Video to Asset Library & Timeline': 'Lưu video AI vào Thư viện tài nguyên & Timeline', 'Prompt': 'Yêu cầu', 'Reference Image': 'Ảnh tham chiếu', 'Existing Video': 'Video có sẵn', 'Model': 'Mô hình', 'Mode': 'Chế độ', 'Generate': 'Tạo', 'Result': 'Kết quả',
  'Universal Brand Kit': 'Bộ nhận diện dùng chung', 'Brand Identity': 'Nhận diện thương hiệu', 'Brand / Business Name': 'Tên thương hiệu / doanh nghiệp', 'Primary Color': 'Màu chính', 'Secondary': 'Màu phụ', 'Accent': 'Màu nhấn', 'Contact & Digital Footprint': 'Liên hệ & thông tin trực tuyến', 'Save & Apply Brand Kit to Project': 'Lưu & áp dụng bộ nhận diện cho dự án'
};

const fragments: Array<[string, string]> = [
  ['Type an AI command', 'Nhập lệnh AI'], ['Please select', 'Vui lòng chọn'], ['Failed to', 'Không thể'], ['Generation Error', 'Lỗi tạo nội dung'], ['Product Studio Error', 'Lỗi AI sản phẩm'], ['Try-On Generation Error', 'Lỗi tạo thử trang phục AI'], ['Parsing error', 'Lỗi đọc tài liệu'], ['Storyboard extraction error', 'Lỗi tạo kịch bản phân cảnh'], ['No API key configured', 'Chưa cấu hình API key'], ['Connection failed', 'Kết nối thất bại'], ['Connection successful', 'Kết nối thành công'], ['Upload', 'Tải lên'], ['Download', 'Tải xuống'], ['Search', 'Tìm kiếm'], ['Settings', 'Cài đặt'], ['Properties', 'Thuộc tính'], ['Layers', 'Lớp'], ['Storyboard', 'Kịch bản phân cảnh'], ['Project name', 'Tên dự án'], ['Export failed', 'Xuất file thất bại'], ['Processing Virtual Try-On...', 'Đang xử lý thử trang phục AI...'], ['WebM export is unavailable in this browser.', 'Trình duyệt này không hỗ trợ xuất WebM.'], ['Split', 'Cắt'], ['Close', 'Đóng']
];

let observer: MutationObserver | null = null;

function translate(value: string): string {
  const t = value.trim();
  if (!t) return value;
  const direct = exact[t];
  if (direct) return value.replace(t, direct);
  let out = value;
  for (const [a, b] of fragments) if (out.includes(a)) out = out.replaceAll(a, b);
  return out;
}

function translateElement(el: Element) {
  for (const attr of ['placeholder', 'title', 'aria-label']) {
    const value = el.getAttribute(attr);
    if (value) {
      const next = translate(value);
      if (next !== value) el.setAttribute(attr, next);
    }
  }
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      const next = translate(node.textContent);
      if (next !== node.textContent) node.textContent = next;
    }
  }
}

function walk(root: Node) {
  if (root.nodeType === Node.ELEMENT_NODE) {
    const el = root as Element;
    if (el.id === TOGGLE_ID) return;
    translateElement(el);
    for (const child of Array.from(el.children)) walk(child);
  }
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `#${TOGGLE_ID}{position:fixed;right:16px;bottom:16px;z-index:9999;display:flex;align-items:center;gap:6px;padding:8px;border:1px solid rgba(148,163,184,.25);background:rgba(15,23,42,.92);backdrop-filter:blur(12px);border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.35);font-family:Inter,system-ui,sans-serif}#${TOGGLE_ID} .hnl-locale-label{font-size:11px;color:#cbd5e1;padding:0 4px 0 6px;font-weight:700;white-space:nowrap}#${TOGGLE_ID} button{border:none;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:800;cursor:pointer;transition:all .2s ease;background:#0f172a;color:#cbd5e1}#${TOGGLE_ID} button.active{background:#f59e0b;color:#0f172a}#${TOGGLE_ID} button:hover{filter:brightness(1.06)}@media (max-width:640px){#${TOGGLE_ID}{right:10px;bottom:10px;padding:6px}#${TOGGLE_ID} .hnl-locale-label{display:none}}`;
  document.head.appendChild(style);
}

function setStoredLocale(locale: Locale) { try { localStorage.setItem(STORAGE_KEY, locale); } catch {} }
export function getStoredLocale(): Locale { try { return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'vi'; } catch { return 'vi'; } }

function createToggle(locale: Locale) {
  injectStyles();
  if (document.getElementById(TOGGLE_ID)) return;
  const root = document.createElement('div');
  root.id = TOGGLE_ID;
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', locale === 'vi' ? 'Đổi ngôn ngữ' : 'Switch language');
  const label = document.createElement('span');
  label.className = 'hnl-locale-label';
  label.textContent = locale === 'vi' ? 'Ngôn ngữ' : 'Language';
  const viBtn = document.createElement('button');
  viBtn.textContent = 'VI'; viBtn.className = locale === 'vi' ? 'active' : ''; viBtn.title = 'Tiếng Việt';
  viBtn.onclick = () => { if (getStoredLocale() !== 'vi') { setStoredLocale('vi'); window.location.reload(); } };
  const enBtn = document.createElement('button');
  enBtn.textContent = 'EN'; enBtn.className = locale === 'en' ? 'active' : ''; enBtn.title = 'English';
  enBtn.onclick = () => { if (getStoredLocale() !== 'en') { setStoredLocale('en'); window.location.reload(); } };
  root.append(label, viBtn, enBtn);
  document.body.appendChild(root);
}

export function initLocaleUI() {
  const locale = getStoredLocale();
  document.documentElement.lang = locale;
  document.title = locale === 'vi' ? 'HNL Creative AI Studio - Studio sáng tạo AI đa phương tiện' : 'HNL Creative AI Studio - Multimodal Creative Studio';
  observer?.disconnect(); observer = null;
  if (locale === 'vi') {
    const apply = () => { if (document.body) { walk(document.body); createToggle('vi'); } };
    apply();
    observer = new MutationObserver(records => { for (const r of records) { for (const n of Array.from(r.addedNodes)) walk(n); if (r.type === 'characterData' && r.target.parentElement) translateElement(r.target.parentElement); } });
    observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
  } else {
    const ensure = () => { if (document.body) createToggle('en'); else requestAnimationFrame(ensure); };
    ensure();
  }
}
