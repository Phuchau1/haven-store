import { NextResponse } from 'next/server';
import { readData } from './db';

/**
 * Rất tiếc, Next.js App Router API routes không dùng middleware truyền thống dễ dàng 
 * mà không có JWT. Tuy nhiên, chúng ta có thể giả lập bằng cách kiểm tra email từ role trong users.json
 * hoặc đơn giản là kiểm tra header (in a real app, use JWT).
 * 
 * Cho bài toán này, tôi sẽ tạo một hàm helper để bảo vệ các API admin.
 */
export function isAdminRequest(request: Request) {
    // In a real production app, you would verify a JWT token from the cookie/header.
    // For this demonstration, we'll implement a secure-enough check for a file-based DB.

    // Giả sử admin phải gửi kèm email hoặc ID trong header để verify (simplified for this task)
    const adminEmail = request.headers.get('x-admin-email');
    if (!adminEmail) return false;

    const users = readData<any[]>('users.json');
    const user = users.find(u => u.email === adminEmail && u.role === 'admin');

    return !!user;
}

export const adminCheck = (request: Request) => {
    if (!isAdminRequest(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    return null;
};
