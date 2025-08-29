import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user } = useCustomAuth();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 載入當前密碼
  useEffect(() => {
    if (user?.id) {
      loadCurrentPassword();
    }
  }, [user]);

  const loadCurrentPassword = async () => {
    if (!user?.id) {
      console.log('⚠️ 無法載入密碼：用戶ID不存在');
      return;
    }

    try {
      console.log(`🔍 載入用戶 ${user.id} (${user.username}) 的密碼`);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('password_hash, username, team_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('載入密碼失敗:', error);
        toast({
          title: "載入失敗",
          description: "無法載入當前密碼",
          variant: "destructive",
        });
        return;
      }

      if (data?.password_hash) {
        console.log(`✅ 成功載入用戶 ${data.username} 的密碼`);
        setOldPassword(data.password_hash);
      } else {
        console.log('⚠️ 該用戶沒有設置密碼');
      }
    } catch (error) {
      console.error('載入密碼時發生錯誤:', error);
    }
  };

  const handlePasswordChange = async () => {
    if (!user?.id || !user?.team_name) {
      toast({
        title: "錯誤",
        description: "無法獲取用戶資訊",
        variant: "destructive",
      });
      return;
    }

    // 驗證輸入
    if (!oldPassword) {
      toast({
        title: "錯誤",
        description: "請輸入舊密碼",
        variant: "destructive",
      });
      return;
    }

    if (!newPassword) {
      toast({
        title: "錯誤",
        description: "請輸入新密碼",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "錯誤",
        description: "新密碼與確認密碼不一致",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "錯誤",
        description: "新密碼長度至少需要6個字元",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 驗證舊密碼
      const { data: authData, error: authError } = await supabase.rpc('authenticate_user', {
        team_name_param: user.team_name,
        username_param: user.username,
        password_param: oldPassword
      });

      if (authError || !authData?.success) {
        toast({
          title: "密碼變更失敗",
          description: "舊密碼錯誤",
          variant: "destructive",
        });
        return;
      }

      // 更新密碼（確保只更新當前用戶的密碼）
      console.log(`🔄 更新用戶 ${user.id} (${user.username}) 的密碼`);
      
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ password_hash: newPassword })
        .eq('id', user.id)
        .eq('username', user.username) // 額外驗證用戶名
        .select();

      if (updateError) {
        console.error('更新密碼失敗:', updateError);
        throw updateError;
      }

      if (!updateData || updateData.length === 0) {
        throw new Error('無法更新密碼：用戶驗證失敗');
      }

      console.log(`✅ 成功更新用戶 ${user.username} 的密碼`);

      toast({
        title: "密碼變更成功",
        description: "您的密碼已成功更新",
      });

      // 清空輸入欄位
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // 重新載入當前密碼
      await loadCurrentPassword();

    } catch (error: any) {
      toast({
        title: "密碼變更失敗",
        description: error.message || "發生未知錯誤",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 如果用戶未登入，顯示錯誤訊息
  if (!user?.id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回主頁
          </Button>
          
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-600 mb-4">
                請先登入
              </h2>
              <p className="text-gray-500 mb-6">
                您需要先登入才能查看個人資訊
              </p>
              <Button onClick={() => navigate("/auth")}>
                前往登入
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* 返回主頁按鈕 */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回主頁
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">個人資訊</CardTitle>
            <CardDescription className="text-center">
              修改您的密碼設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 用戶資訊顯示 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">用戶名稱</Label>
                  <p className="text-lg font-semibold">{user?.username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">所屬團隊</Label>
                  <p className="text-lg font-semibold">{user?.team_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">用戶角色</Label>
                  <p className="text-lg font-semibold">{user?.roles?.join(', ') || '盟友'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">用戶ID</Label>
                  <p className="text-xs font-mono text-gray-500">{user?.id}</p>
                </div>
              </div>
            </div>

            {/* 密碼變更表單 */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="oldPassword">舊密碼</Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="請輸入目前的密碼"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  >
                    {showOldPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword">新密碼</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="請輸入新密碼（至少6個字元）"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">再輸入一次新密碼</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="請再次輸入新密碼"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                onClick={handlePasswordChange}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? "正在變更密碼..." : "變更密碼"}
              </Button>
            </div>

            {/* 安全提醒 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">安全提醒</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 密碼長度至少需要6個字元</li>
                <li>• 建議使用包含數字和字母的密碼</li>
                <li>• 請勿與他人分享您的密碼</li>
                <li>• 變更密碼後，請使用新密碼重新登入</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;