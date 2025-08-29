import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle, RotateCcw, Package, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";

const UnsoldItems = () => {
  const navigate = useNavigate();
  const { profile, team, user } = useCustomAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [unsoldItems, setUnsoldItems] = useState([]);

  useEffect(() => {
    // 從 localStorage 獲取流標商品
    const unsoldItems = JSON.parse(localStorage.getItem('unsoldItems') || '[]');
    setUnsoldItems(unsoldItems);
  }, []);

  const getItemLevelColor = (level: string) => {
    switch (level) {
      case "稀有": return "text-blue-400 bg-blue-400/10";
      case "英雄": return "text-treasure-purple bg-purple-400/10";
      case "傳說": return "text-treasure-gold bg-treasure-gold/10";
      default: return "text-gray-400 bg-gray-400/10";
    }
  };

  const getItemLevelIcon = (level: string) => {
    switch (level) {
      case "稀有": return "💎";
      case "英雄": return "⚔️";
      case "傳說": return "👑";
      default: return "🔮";
    }
  };

  const handleRelist = (item) => {
    // 將流標商品重新加入等待上架列表
    const existingPending = JSON.parse(localStorage.getItem('pendingTreasures') || '[]');
    const relistItem = {
      ...item,
      id: Date.now(), // 生成新的ID
      status: "等待上架",
      registeredAt: new Date().toLocaleString('zh-TW'),
      registeredBy: profile?.username || "管理員",
      teamId: team?.id
    };
    
    const updatedPending = [relistItem, ...existingPending];
    localStorage.setItem('pendingTreasures', JSON.stringify(updatedPending));
    
    // 從流標區移除
    const updatedUnsold = unsoldItems.filter(unsoldItem => unsoldItem.id !== item.id);
    setUnsoldItems(updatedUnsold);
    localStorage.setItem('unsoldItems', JSON.stringify(updatedUnsold));
    
    toast({
      title: "重新上架成功",
      description: `${item.itemName} 已移至等待上架列表`,
    });
  };

  const handleDeleteItem = (item) => {
    // 刪除單個流標商品
    const updatedUnsold = unsoldItems.filter(unsoldItem => unsoldItem.id !== item.id);
    setUnsoldItems(updatedUnsold);
    localStorage.setItem('unsoldItems', JSON.stringify(updatedUnsold));
    
    toast({
      title: "刪除成功",
      description: `${item.itemName} 已從流標區中移除`,
    });
  };

  const clearUnsoldItems = () => {
    // 清除所有流標商品
    localStorage.setItem('unsoldItems', JSON.stringify([]));
    setUnsoldItems([]);
    
    toast({
      title: "流標區已清空",
      description: "所有流標商品已從記錄中移除",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-treasure-deep-blue to-treasure-royal-blue p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="text-treasure-gold border-treasure-border hover:bg-treasure-surface backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首頁
            </Button>
            <div className="text-white">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                📦 流標區
              </h1>
              <p className="text-treasure-gold/80">
                {team?.name} | {user?.username}
              </p>
            </div>
          </div>
          
          {unsoldItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearUnsoldItems}
              className="text-red-400 border-red-400/50 hover:bg-red-400/10"
            >
              清空流標區
            </Button>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-400/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-treasure-gold/70">流標商品</p>
                  <p className="text-xl font-bold text-treasure-gold">{unsoldItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-400/20 rounded-lg">
                  <Package className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-treasure-gold/70">總起標價值</p>
                  <p className="text-xl font-bold text-treasure-gold">
                    {unsoldItems.reduce((total, item) => total + (item.startingPrice || 0), 0)} 鑽石
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-400/20 rounded-lg">
                  <RotateCcw className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-treasure-gold/70">可重新上架</p>
                  <p className="text-xl font-bold text-treasure-gold">{unsoldItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unsold Items List */}
        {unsoldItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {unsoldItems.map((item) => (
              <Card key={item.id} className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
                <CardHeader className="pb-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-b border-treasure-border">
                  <CardTitle className="flex items-center gap-3">
                    <span className="text-2xl">{getItemLevelIcon(item.itemLevel)}</span>
                    <div>
                      <div className="text-lg text-treasure-gold">{item.itemName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getItemLevelColor(item.itemLevel)}`}>
                          {item.itemLevel}
                        </Badge>
                        <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                          流標
                        </Badge>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4 p-6">
                  <div className="text-sm text-treasure-gold/70">
                    <div>BOSS：{item.bossName}</div>
                    <div>伺服器：{item.serverName}</div>
                    <div>完成時間：{item.completedAt}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-treasure-gold/70">起標價格</div>
                      <div className="font-semibold text-treasure-gold">{item.startingPrice} 鑽石</div>
                    </div>
                    <div>
                      <div className="text-treasure-gold/70">競標人數</div>
                      <div className="font-semibold text-red-400">{item.bidderCount || 0} 人</div>
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="text-treasure-gold/70 mb-2">參與成員 ({item.participants?.length || 0})</div>
                    <div className="flex flex-wrap gap-1">
                      {item.participants?.map((participant, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-treasure-border text-treasure-gold/70">
                          {participant}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-treasure-border space-y-2">
                    <Button
                      onClick={() => handleRelist(item)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      重新上架
                    </Button>
                    
                    {/* 刪除按紐 - 只有拍賣員和管理者可見 */}
                    {(hasPermission('pending') || hasPermission('account-settings')) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="w-full text-red-400 border-red-400/50 hover:bg-red-400/10 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            刪除資料
                          </Button>
                        </AlertDialogTrigger>
                        
                        <AlertDialogContent className="max-w-md bg-treasure-surface/95 backdrop-blur-sm border-treasure-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-400 text-xl">
                              <Trash2 className="w-5 h-5 inline mr-2" />
                              確認刪除
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-treasure-gold/70">
                              確定要刪除「{item.itemName}」嗎？此操作將永久移除該物品資料且無法撤銷。
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter className="space-x-2">
                            <AlertDialogCancel className="bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 border-gray-500">
                              取消
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteItem(item)}
                              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 to-red-400 text-white"
                            >
                              確認刪除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 text-treasure-gold/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-treasure-gold mb-2">
                目前沒有流標商品
              </h3>
              <p className="text-treasure-gold/60 mb-6">
                所有拍賣商品都已成功售出
              </p>
              <Button
                onClick={() => navigate("/auction")}
                className="bg-gradient-to-r from-treasure-gold to-treasure-amber hover:from-treasure-amber hover:to-treasure-gold text-black"
              >
                前往拍賣場
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UnsoldItems;