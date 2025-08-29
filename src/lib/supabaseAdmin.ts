import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// 這裡需要使用 service role key，但為了安全起見，我們先創建一個模擬的解決方案
// 在生產環境中，這些操作應該通過後端 API 進行

const SUPABASE_URL = "https://yjpwuunjdfjvdmhqssgm.supabase.co";

// 注意：這裡需要 service role key，但我們暫時使用 anon key
// 真正的解決方案需要在 Supabase Dashboard 中創建 stored functions
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcHd1dW5qZGZqdmRtaHFzc2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODE3NjcsImV4cCI6MjA3MTM1Nzc2N30.3vAip7yoLEZz2PblKbTZBRwJ6Ua3yLdhZiUa-tT6SUg";

export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// 管理員專用的刪除函數
export const deleteTeamMemberAdmin = async (memberId: string): Promise<boolean> => {
  try {
    console.log('🔧 使用管理員權限刪除成員:', memberId);
    
    // 先刪除用戶角色
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('profile_id', memberId);
    
    if (roleError) {
      console.warn('⚠️ 刪除用戶角色失敗:', roleError);
    }
    
    // 刪除個人檔案
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', memberId);
    
    if (profileError) {
      console.error('❌ 刪除個人檔案失敗:', profileError);
      throw profileError;
    }
    
    console.log('✅ 管理員權限刪除成功');
    return true;
  } catch (error) {
    console.error('❌ 管理員刪除操作失敗:', error);
    throw error;
  }
};

// 批量清理團隊成員
export const clearAllTeamMembersAdmin = async (
  teamId: string, 
  excludeUsernames: string[] = ['超級管理員']
): Promise<{ deletedCount: number; message: string }> => {
  try {
    console.log('🔧 使用管理員權限批量清理成員...');
    
    // 獲取要刪除的成員列表
    const { data: members, error: queryError } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .eq('team_id', teamId)
      .not('username', 'in', `(${excludeUsernames.map(name => `"${name}"`).join(',')})`);
    
    if (queryError) {
      console.error('❌ 查詢成員失敗:', queryError);
      throw queryError;
    }
    
    if (!members || members.length === 0) {
      return { deletedCount: 0, message: '沒有需要刪除的成員' };
    }
    
    console.log(`📊 找到 ${members.length} 個需要刪除的成員`);
    
    let deletedCount = 0;
    
    for (const member of members) {
      try {
        await deleteTeamMemberAdmin(member.id);
        deletedCount++;
        console.log(`✅ 成功刪除: ${member.username}`);
      } catch (error) {
        console.error(`❌ 刪除 ${member.username} 失敗:`, error);
      }
    }
    
    return {
      deletedCount,
      message: `成功刪除 ${deletedCount} 個成員`
    };
  } catch (error) {
    console.error('❌ 批量清理失敗:', error);
    throw error;
  }
};