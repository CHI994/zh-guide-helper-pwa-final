import { useCustomAuth } from "./useCustomAuth";

type UserRole = '盟友' | '開單員' | '拍賣員' | '會計' | '管理者';

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  '盟友': [
    'announcements',
    'auction', 
    'account-inquiry',
    'wallet',
    'public-fund',
    'profile'
  ],
  '開單員': [
    'announcements',
    'auction',
    'account-inquiry', 
    'wallet',
    'public-fund',
    'treasure',
    'profile'
  ],
  '拍賣員': [
    'announcements',
    'auction',
    'account-inquiry',
    'wallet', 
    'public-fund',
    'pending',
    'unsold',
    'profile'
  ],
  '會計': [
    'announcements',
    'auction',
    'account-inquiry',
    'wallet',
    'public-fund',
    'completed',
    'audit',
    'profile'
  ],
  '管理者': [
    'announcements',
    'auction',
    'account-inquiry',
    'wallet',
    'public-fund',
    'public-fund-manager',
    'treasure',
    'pending',
    'completed',
    'unsold',
    'audit',
    'announcement-settings',
    'basic-settings',
    'account-settings',
    'profile'
  ]
};

export const usePermissions = () => {
  const { userRole, userRoles, user } = useCustomAuth();

  const hasPermission = (permission: string): boolean => {
    // 超級管理員擁有所有權限
    if (user?.is_super_admin) {
      console.log(`🔱 超級管理員權限檢查: ${permission} = true`);
      return true;
    }

    if (!userRoles || userRoles.length === 0) {
      console.log("⚠️ usePermissions: 沒有用戶角色");
      return false;
    }
    
    // Check if any of the user's roles has the permission
    const hasAccess = userRoles.some(role => 
      ROLE_PERMISSIONS[role as UserRole]?.includes(permission) || false
    );
    
    console.log(`🔍 權限檢查: ${userRoles.join(', ')} -> ${permission} = ${hasAccess}`);
    return hasAccess;
  };

  const getRoleDisplayName = (role: string): string => {
    return role;
  };

  return {
    hasPermission,
    userRole,
    userRoles,
    getRoleDisplayName
  };
};