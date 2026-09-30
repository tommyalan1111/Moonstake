# Moonstake dApp - Playwright Automation Testing Project Context

## 1. Tổng quan & Môi trường Dự án
- **Mục tiêu**: Xây dựng E2E Automated Testing Framework cho Moonstake dApp bằng Playwright/TypeScript, tích hợp AI (Google Gemini API).
- **Môi trường**: Windows 11, Chrome Browser.
- **Xác thực**: State-authenticated thông qua file `user_data/state.json`.
- **Cấu hình & Credentials**:
  - Test Wallet Address: `0x8bd50ecf6f8eac4d90c49bb7575c4c5894f7cef0`
  - Etherscan API Key: `V236XENUCQNQ2TWMB3UX4NENH2UX7M4FTS` (Đã cấu hình dùng Etherscan API V2)
  - Gemini API Key: Quản lý qua file `.env` (`GEMINI_API_KEY`)
- **Tech Stack**: Playwright, TypeScript, Etherscan API V2, `@google/genai` SDK, `dotenv`.

## 2. Cấu trúc Dự án
- `tests/balance-onchain.spec.ts`: Test case xác minh tính toàn vẹn số dư (Balance Integrity Verification) giữa UI Moonstake và On-Chain (Etherscan).
- `tests/ai-visual-check.spec.ts`: Test case ứng dụng Gemini AI kiểm tra UI/Layout từ screenshot.
- `utils/gemini.ts`: Module helper chứa các hàm gọi Gemini API (`askGemini`, `analyzeImageWithGemini`).
- `playwright.config.ts`: Cấu hình Playwright, tích hợp `dotenv`.
- `.env`: Chứa các biến môi trường riêng tư (`GEMINI_API_KEY`).

## 3. Tiến độ & Các vấn đề kỹ thuật đã xử lý
1. **Xử lý UI Locators**:
   - Dùng `.filter({ hasText: symbol }).first()` trên thẻ `div.balance` để giải quyết triệt để Strict Mode violations.
   - Thêm logic chuyển tab linh hoạt: **ETH** nằm ở tab `Coins`, **USDT** nằm ở tab `Tokens`. Bỏ yêu cầu bắt buộc `scrollIntoViewIfNeeded` để tránh timeout khi element đã attached trên DOM.
2. **Blockchain & Multi-Chain API Integration**:
   - **Ethereum (ETH) & USDT (ERC20)**: Sử dụng **Etherscan API V2** (`chainid=1`).
   - **Polygon (MATIC)**: Dùng chung ví EVM (`TEST_WALLET_ADDRESS`), truy vấn qua Etherscan V2 với `chainid=137`.
   - **Tezos (XTZ)**: Ví định dạng `tz1...` (`TEZOS_WALLET_ADDRESS`), truy vấn trực tiếp qua **TzKT Public API** (`https://api.tzkt.io/v1/accounts/.../balance`, decimals: 6).
   - **Avalanche C-Chain (AVAX)**: Dùng chung ví EVM, truy vấn trực tiếp node RPC chính thức của Avalanche qua JSON-RPC `eth_getBalance` (`https://api.avax.network/ext/bc/C/rpc`, decimals: 18).
   - Kết quả test: Toàn bộ **ETH, MATIC, XTZ, AVAX** đều đã **PASSED 100%**, đối chiếu chính xác giữa UI Moonstake và On-Chain.
3. **AI Integration**:
   - Đã cài đặt thành công SDK chính thức `@google/genai`.
   - Đã cấu hình module helper `utils/gemini.ts` phục vụ Visual Testing và Log Analysis.
4. **Git Repository**:
   - Toàn bộ code mới nhất (bao gồm test balance on-chain V2 API, multi-chain AVAX/MATIC/XTZ và bài test Gemini Visual) đã được duy trì ổn định.