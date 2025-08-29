import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
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

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  team: Team | null;
  userRole: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  team: null,
  userRole: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    console.log("開始獲取用戶數據，用戶ID:", userId);
    try {
      // Fetch profile with maybeSingle to avoid errors if not found
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      console.log("Profile 查詢結果:", { profileData, profileError });

      if (profileData) {
        setProfile(profileData);
        console.log("設置 profile:", profileData);
        
        // Fetch team
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("*")
          .eq("id", profileData.team_id)
          .maybeSingle();
          
        console.log("Team 查詢結果:", { teamData, teamError });
          
        if (teamData) {
          setTeam(teamData);
          console.log("設置 team:", teamData);
        } else {
          console.error("未找到團隊數據或查詢失敗:", teamError);
        }

        // Fetch user role (get the highest priority role)
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("profile_id", profileData.id)
          .order("granted_at", { ascending: false });
          
        if (roleData && roleData.length > 0) {
          // 設定優先順序：管理者 > 會計 > 拍賣員 > 開單員 > 盟友
          const rolePriority = ['管理者', '會計', '拍賣員', '開單員', '盟友'];
          const userRoles = roleData.map(r => r.role);
          
          // 確保選擇最高權限的角色
          let highestRole: string | null = null;
          for (const priority of rolePriority) {
            if (userRoles.includes(priority as any)) {
              highestRole = priority;
              break;
            }
          }
          
          setUserRole(highestRole || userRoles[0]);
        } else {
          setUserRole(null);
        }
      } else {
        console.log("No profile found for user:", userId);
        setProfile(null);
        setTeam(null);
        setUserRole(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setProfile(null);
      setTeam(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setTeam(null);
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    profile,
    team,
    userRole,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};