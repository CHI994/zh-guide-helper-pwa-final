import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  team_id: string;
  username: string;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  created_at: string;
}

interface CustomUser {
  id: string;
  username: string;
  email: string;
  team_id: string;
  team_name: string;
  is_super_admin?: boolean;
  is_hidden?: boolean;
}

interface CustomAuthContextType {
  user: CustomUser | null;
  profile: Profile | null;
  team: Team | null;
  userRole: string | null;
  userRoles: string[];
  loading: boolean;
  login: (team: string, username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const CustomAuthContext = createContext<CustomAuthContextType>({
  user: null,
  profile: null,
  team: null,
  userRole: null,
  userRoles: [],
  loading: true,
  login: async () => ({ success: false }),
  logout: () => {},
  refreshUserData: async () => {},
});

export const useCustomAuth = () => {
  const context = useContext(CustomAuthContext);
  if (!context) {
    throw new Error("useCustomAuth must be used within CustomAuthProvider");
  }
  return context;
};

// 儲存在 localStorage 的key
const CUSTOM_AUTH_KEY = "custom_auth_session";

export const CustomAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 獲取團隊預設密碼
  const getTeamPassword = (): string => {
    const savedSettings = localStorage.getItem("basicSettings");
    let teamPassword = "password123"; // Default fallback
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        teamPassword = parsed.teamPassword || teamPassword;
      } catch (error) {
        console.error("Failed to load team password:", error);
      }
    }
    
    return teamPassword;
  };

  // 統一驗證登入憑證（使用新的數據庫函數）
  const validateCredentials = async (teamName: string, username: string, password: string) => {
    try {
      console.log('🔐 開始驗證用戶:', { teamName, username });
      
      // 檢查是否為超級管理員登入
      if (username === 'GM001' && password === '32903290') {
        console.log('🔱 檢測到超級管理員登入嘗試');
        
        // 先檢查 authenticate_super_admin 函數是否存在，如果不存在則使用臨時邏輯
        try {
          const { data, error } = await supabase.rpc('authenticate_super_admin', {
            target_team_name: teamName,
            username_param: username,
            password_param: password
          });
          
          if (error) {
            console.error('❌ 超級管理員驗證函數不存在或錯誤:', error);
            
            // 數據庫函數不存在時的臨時驗證邏輯
            console.log('🔧 使用臨時超級管理員驗證邏輯');
            
            // 查找目標團隊
            const { data: teamData, error: teamError } = await supabase
              .from('teams')
              .select('*')
              .eq('name', teamName)
              .single();
            
            if (teamError || !teamData) {
              return { success: false, error: '找不到指定的團隊' };
            }
            
            // 返回臨時超級管理員認證結果 (使用目標團隊身份)
            return {
              success: true,
              userData: {
                id: '00000000-0000-0000-0000-000000000001',
                user_id: '00000000-0000-0000-0000-000000000001',
                username: 'GM001',
                team_id: teamData.id, // 使用目標團隊的ID
                team_name: teamData.name, // 使用目標團隊的名稱
                roles: ['管理者'], // 使用目標團隊的最高權限角色
                isPredefined: false,
                is_super_admin: true, // 保持超級管理員標記
                is_hidden: true
              }
            };
          }
          
          console.log('📡 超級管理員驗證結果:', data);
          
          if (data && data.success) {
            return {
              success: true,
              userData: {
                id: data.user_id,
                user_id: data.user_id,
                username: data.username,
                team_id: data.team_id, // 來自數據庫函數的目標團隊ID
                team_name: data.team_name, // 來自數據庫函數的目標團隊名稱
                roles: ['管理者'], // 使用目標團隊的最高權限角色
                isPredefined: false,
                is_super_admin: true, // 保持超級管理員標記
                is_hidden: true
              }
            };
          }
          
          return { success: false, error: data?.message || '超級管理員認證失敗' };
        } catch (error) {
          console.error('❌ 超級管理員驗證異常:', error);
          return { success: false, error: '超級管理員驗證系統異常' };
        }
      }
      
      // 一般用戶驗證
      const { data, error } = await supabase.rpc('authenticate_user', {
        team_name_param: teamName,
        username_param: username,
        password_param: password
      });
      
      if (error) {
        console.error('❌ 數據庫驗證錯誤:', error);
        return { success: false, error: '驗證系統錯誤' };
      }
      
      console.log('📡 驗證結果:', data);
      
      if (data && data.success) {
        const userData = data.user;
        return {
          success: true,
          userData: {
            id: userData.id,
            user_id: userData.user_id,
            username: userData.username,
            team_id: userData.team_id,
            team_name: userData.team_name,
            roles: userData.roles || ['盟友'],
            isPredefined: false,
            is_super_admin: false,
            is_hidden: false
          }
        };
      }
      
      return { success: false, error: data?.error || '帳號或密碼錯誤' };
      
    } catch (error) {
      console.error('❌ 驗證過程錯誤:', error);
      return { success: false, error: '驗證系統錯誤' };
    }
  };

  // 獲取用戶詳細資料（統一處理所有帳號）
  const fetchUserData = async (userId: string, teamId: string, roles?: string[]) => {
    try {
      console.log('👤 載入用戶詳細資料:', { userId, teamId, roles });
      
      // 檢查是否為超級管理員
      if (userId === '00000000-0000-0000-0000-000000000001') {
        console.log('🔱 超級管理員身份，創建虛擬 Profile 和 Team');
        
        // 獲取目標團隊資料
        const { data: targetTeamData, error: teamError } = await supabase
          .from("teams")
          .select("*")
          .eq("id", teamId)
          .single();
        
        if (targetTeamData) {
          // 設置目標團隊
          setTeam(targetTeamData);
          console.log('✅ 目標團隊載入成功:', targetTeamData);
          
          // 創建虛擬的超級管理員 Profile（屬於目標團隊）
          const virtualProfile = {
            id: userId,
            user_id: userId,
            username: 'GM001',
            team_id: teamId, // 使用目標團隊ID
            created_at: new Date().toISOString(),
            is_super_admin: true,
            is_hidden: true,
            roles: ['管理者'] // 該團隊的最高權限
          };
          
          setProfile(virtualProfile);
          console.log('✅ 虛擬 Profile 創建成功:', virtualProfile);
        } else {
          console.error('❌ 無法載入目標團隊:', teamError);
        }
        
        // 超級管理員固定使用管理者角色
        setUserRoles(['管理者']);
        setUserRole('管理者');
        console.log('🔱 超級管理員角色設定完成');
      } else {
        // 一般用戶的原有邏輯
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);
          console.log('✅ Profile 載入成功:', profileData);
          
          // 獲取團隊資料
          const { data: teamData, error: teamError } = await supabase
            .from("teams")
            .select("*")
            .eq("id", profileData.team_id)
            .maybeSingle();
            
          if (teamData) {
            setTeam(teamData);
            console.log('✅ Team 載入成功:', teamData);
          }
          
          // 處理一般用戶角色 - 優先從本地存儲獲取
          let userRolesArray = roles || [];
          
          // 優先檢查本地存儲的角色信息
          const memberRoles = JSON.parse(localStorage.getItem('memberRoles') || '{}');
          const localRoles = memberRoles[userId];
          
          if (localRoles && Array.isArray(localRoles) && localRoles.length > 0) {
            console.log("✅ 從本地存儲獲取角色:", localRoles);
            userRolesArray = localRoles;
          } else if (userRolesArray.length === 0) {
            // 如果本地存儲沒有，才從數據庫獲取角色
            console.log("📡 從數據庫獲取角色...");
            const { data: roleData, error: roleError } = await supabase
              .from("user_roles")
              .select("role")
              .eq("profile_id", userId)
              .order("granted_at", { ascending: false });
              
            if (roleData && roleData.length > 0) {
              userRolesArray = roleData.map(r => r.role);
              // 同步到本地存儲
              memberRoles[userId] = userRolesArray;
              localStorage.setItem('memberRoles', JSON.stringify(memberRoles));
              console.log("✅ 數據庫角色已同步到本地存儲");
            } else {
              userRolesArray = ['盟友']; // 預設角色
            }
          }
          
          // 設定角色
          setUserRoles(userRolesArray);
          
          // 選擇最高權限角色作為主要角色
          const rolePriority = ['管理者', '會計', '拍賣員', '開單員', '盟友'];
          let highestRole = '盟友';
          for (const priority of rolePriority) {
            if (userRolesArray.includes(priority)) {
              highestRole = priority;
              break;
            }
          }
          setUserRole(highestRole);
          
          console.log('🎭 一般用戶角色設定完成:', { userId, highestRole, allRoles: userRolesArray });
        }
      }
    } catch (error) {
      console.error("❌ 載入用戶資料錯誤:", error);
    }
  };

  // 統一登入函數
  const login = async (teamName: string, username: string, password: string) => {
    console.log('🚀 開始登入流程:', { teamName, username });
    
    const validation = await validateCredentials(teamName, username, password);
    
    if (validation.success && validation.userData) {
      const userData = validation.userData;
      console.log('✅ 驗證成功，用戶資料:', userData);
      
      // 儲存到 localStorage
      localStorage.setItem(CUSTOM_AUTH_KEY, JSON.stringify(userData));
      
      // 設定狀態
      setUser({
        id: userData.id,
        username: userData.username,
        email: `${userData.username}@${userData.team_name}.local`, // 虛擬 email，不實際使用
        team_id: userData.team_id,
        team_name: userData.team_name,
        is_super_admin: userData.is_super_admin || false,
        is_hidden: userData.is_hidden || false
      });
      
      // 獲取詳細資料（傳入角色信息）
      await fetchUserData(userData.id, userData.team_id, userData.roles);
      
      console.log('🎉 登入流程完成');
      return { success: true };
    }
    
    console.log('❌ 登入失敗:', validation.error);
    return { success: false, error: validation.error || "登入失敗" };
  };

  // 登出函數
  const logout = () => {
    localStorage.removeItem(CUSTOM_AUTH_KEY);
    setUser(null);
    setProfile(null);
    setTeam(null);
    setUserRole(null);
    setUserRoles([]);
  };

  // 監聽角色更新事件來刷新權限
  useEffect(() => {
    const handleRoleUpdate = (e: CustomEvent) => {
      const { memberId, newRoles, isCurrentUser } = e.detail;
      console.log("🎯 收到角色更新事件:", { memberId, newRoles, isCurrentUser });
      
      // 🔱 超級管理員不需要刷新權限，避免權限被重置
      if (user?.is_super_admin) {
        console.log("🔱 超級管理員忽略角色更新事件");
        return;
      }
      
      if (isCurrentUser && user?.id && profile?.id) {
        console.log("🔄 當前用戶角色已更新，刷新權限...");
        // 立即刷新用戶數據以更新權限
        fetchUserData(user.id, user.team_id).then(() => {
          console.log("✅ 權限刷新完成");
        });
      }
    };

    window.addEventListener('memberRolesUpdated', handleRoleUpdate);
    return () => window.removeEventListener('memberRolesUpdated', handleRoleUpdate);
  }, [user?.id, profile?.id, user?.is_super_admin]);

  // 初始化檢查
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const stored = localStorage.getItem(CUSTOM_AUTH_KEY);
        if (stored) {
          const userData = JSON.parse(stored);
          setUser(userData);
          await fetchUserData(userData.id, userData.team_id);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        localStorage.removeItem(CUSTOM_AUTH_KEY);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 刷新用戶數據的函數
  const refreshUserData = async () => {
    if (user?.id && user.team_id) {
      await fetchUserData(user.id, user.team_id);
    }
  };

  const value = {
    user,
    profile,
    team,
    userRole,
    userRoles,
    loading,
    login,
    logout,
    refreshUserData,
  };

  return (
    <CustomAuthContext.Provider value={value}>
      {children}
    </CustomAuthContext.Provider>
  );
};