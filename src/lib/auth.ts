/**
 * 古时月 —— Supabase Auth 客户端 Hook
 * 提供用户登录/注册/登出功能，以及当前登录状态。
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getBrowserClient } from "./supabase";

export interface AuthState {
  user: User | null;
  loading: boolean;
  /** 获取当前用户的 access_token，用于 API 调用 */
  accessToken: string | null;
}

/**
 * useAuth Hook
 * 管理当前用户的登录状态
 */
export function useAuth(): AuthState & {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
} {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const client: SupabaseClient | null = getBrowserClient();

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }

    // 获取当前会话
    client.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAccessToken(session?.access_token ?? null);
      setLoading(false);
    });

    // 监听认证状态变化
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAccessToken(session?.access_token ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [client]);

  /** 邮箱密码登录 */
  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!client) return { error: "Supabase 未配置" };
      const { error } = await client.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [client]
  );

  /** 邮箱注册 */
  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!client) return { error: "Supabase 未配置" };
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) return { error: error.message };
      // 如果需要邮箱验证，data.user 存在但 session 为 null
      if (data.user && !data.session) {
        return { error: "注册成功！请查收邮箱完成验证后登录。" };
      }
      return { error: null };
    },
    [client]
  );

  /** 登出 */
  const signOut = useCallback(async () => {
    if (!client) return;
    await client.auth.signOut();
  }, [client]);

  return { user, loading, accessToken, signIn, signUp, signOut };
}
