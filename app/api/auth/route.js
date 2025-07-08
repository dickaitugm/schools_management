import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import bcrypt from "bcryptjs";

// POST - Login authentication
export async function POST(request) {
    try {
        const { username, password } = await request.json();

        // Validate required fields
        if (!username || !password) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Username dan password wajib diisi",
                },
                { status: 400 }
            );
        }

        // Find user by username or email
        const userQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.password_hash,
        u.name,
        u.role,
        u.role_id,
        u.is_active,
        u.last_login,
        r.name as role_name,
        r.description as role_description,
        r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE (u.username = $1 OR u.email = $1) AND u.is_active = true
    `;

        const userResult = await pool.query(userQuery, [username]);

        if (userResult.rows.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Username atau password salah",
                },
                { status: 401 }
            );
        }

        const user = userResult.rows[0];

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Username atau password salah",
                },
                { status: 401 }
            );
        }

        // Update last login
        await pool.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1", [
            user.id,
        ]);

        // Prepare user data (without password_hash)
        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role_name || user.role, // Use role name from roles table
            role_id: user.role_id,
            role_name: user.role_name,
            role_description: user.role_description,
            permissions: user.role_permissions || [],
            is_active: user.is_active,
            last_login: new Date().toISOString(),
        };

        return NextResponse.json({
            success: true,
            data: userData,
            message: "Login berhasil",
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Terjadi kesalahan saat login",
            },
            { status: 500 }
        );
    }
}
