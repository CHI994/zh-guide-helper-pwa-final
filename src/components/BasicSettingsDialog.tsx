import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BasicSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Settings {
  teamPassword: string;
  checkInId: string;
  editTimeLimit: number;
  supplementTimeLimit: number;
  deleteTimeLimit: number;
  exchangeTaxRate: number;
  auctionCommissionRate: number;
  auctionCommissionRateRare: number;
  auctionCommissionRateHero: number;
  auctionCommissionRateLegendary: number;
  bonusForOpener: boolean;
  bonusForLeader: boolean;
}

export function BasicSettingsDialog({ open, onOpenChange }: BasicSettingsDialogProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>({
    teamPassword: "",
    checkInId: "",
    editTimeLimit: 24,
    supplementTimeLimit: 48,
    deleteTimeLimit: 72,
    exchangeTaxRate: 3,
    auctionCommissionRate: 10,
    auctionCommissionRateRare: 8,
    auctionCommissionRateHero: 12,
    auctionCommissionRateLegendary: 15,
    bonusForOpener: false,
    bonusForLeader: false,
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("basicSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
  }, []);

  const generateCheckInId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSettings(prev => ({ ...prev, checkInId: result }));
    toast({
      title: "簽到識別碼已更新",
      description: "新的16位識別碼已生成",
    });
  };

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem("basicSettings", JSON.stringify(settings));
    toast({
      title: "設定已儲存",
      description: "所有基本設定已成功儲存",
    });
    onOpenChange(false);
  };

  const handleInputChange = (field: keyof Settings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">🔧 基本設定</DialogTitle>
          <DialogDescription>
            配置團隊的基本參數和運營設定
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Team Password */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔐 團隊密碼</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="teamPassword">密碼</Label>
                <Input
                  id="teamPassword"
                  type="text"
                  value={settings.teamPassword}
                  onChange={(e) => handleInputChange("teamPassword", e.target.value)}
                  placeholder="輸入團隊密碼"
                />
              </div>
            </CardContent>
          </Card>

          {/* Check-in ID */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📱 簽到識別碼</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label htmlFor="checkInId">識別碼 (16位英數組合)</Label>
                <div className="flex gap-2">
                  <Input
                    id="checkInId"
                    value={settings.checkInId}
                    onChange={(e) => handleInputChange("checkInId", e.target.value)}
                    placeholder="簽到識別碼"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={generateCheckInId}
                    title="生成新識別碼"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diamond Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💎 分鑽入帳設定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editTimeLimit">編輯期限 (小時)</Label>
                  <Input
                    id="editTimeLimit"
                    type="number"
                    value={settings.editTimeLimit}
                    onChange={(e) => handleInputChange("editTimeLimit", parseInt(e.target.value) || 0)}
                    placeholder="開單後幾小時"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplementTimeLimit">補單期限 (小時)</Label>
                  <Input
                    id="supplementTimeLimit"
                    type="number"
                    value={settings.supplementTimeLimit}
                    onChange={(e) => handleInputChange("supplementTimeLimit", parseInt(e.target.value) || 0)}
                    placeholder="開單後幾小時"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deleteTimeLimit">刪除期限 (小時)</Label>
                  <Input
                    id="deleteTimeLimit"
                    type="number"
                    value={settings.deleteTimeLimit}
                    onChange={(e) => handleInputChange("deleteTimeLimit", parseInt(e.target.value) || 0)}
                    placeholder="開單後幾小時"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="exchangeTaxRate">交易所稅率 (%)</Label>
                  <Input
                    id="exchangeTaxRate"
                    type="number"
                    step="0.1"
                    value={settings.exchangeTaxRate}
                    onChange={(e) => handleInputChange("exchangeTaxRate", parseFloat(e.target.value) || 0)}
                    placeholder="稅率百分比"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Public Fund Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🏛️ 拍賣抽成設定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-medium">拍賣抽成比例</h4>
                  <span className="text-sm text-muted-foreground">
                    根據物品等級設定不同抽成%數
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="auctionCommissionRate">一般物品 (%)</Label>
                    <div className="relative">
                      <Input
                        id="auctionCommissionRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        value={settings.auctionCommissionRate}
                        onChange={(e) => handleInputChange("auctionCommissionRate", parseFloat(e.target.value) || 0)}
                        placeholder="一般物品抽成%"
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="auctionCommissionRateRare">稀有物品 (%)</Label>
                    <div className="relative">
                      <Input
                        id="auctionCommissionRateRare"
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        value={settings.auctionCommissionRateRare}
                        onChange={(e) => handleInputChange("auctionCommissionRateRare", parseFloat(e.target.value) || 0)}
                        placeholder="稀有物品抽成%"
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="auctionCommissionRateHero">英雄物品 (%)</Label>
                    <div className="relative">
                      <Input
                        id="auctionCommissionRateHero"
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        value={settings.auctionCommissionRateHero}
                        onChange={(e) => handleInputChange("auctionCommissionRateHero", parseFloat(e.target.value) || 0)}
                        placeholder="英雄物品抽成%"
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="auctionCommissionRateLegendary">傳說物品 (%)</Label>
                    <div className="relative">
                      <Input
                        id="auctionCommissionRateLegendary"
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        value={settings.auctionCommissionRateLegendary}
                        onChange={(e) => handleInputChange("auctionCommissionRateLegendary", parseFloat(e.target.value) || 0)}
                        placeholder="傳說物品抽成%"
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    💡 <strong>抽成說明：</strong>拍賣結束時會根據物品等級自動選擇對應的抽成比例，抽成金額將直接轉入公基金
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diamond Distribution Mechanism */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💎 分鑽機制</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bonusForOpener"
                    checked={settings.bonusForOpener}
                    onCheckedChange={(checked) => 
                      handleInputChange("bonusForOpener", checked === true)
                    }
                  />
                  <Label htmlFor="bonusForOpener">開單者多一份</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bonusForLeader"
                    checked={settings.bonusForLeader}
                    onCheckedChange={(checked) => 
                      handleInputChange("bonusForLeader", checked === true)
                    }
                  />
                  <Label htmlFor="bonusForLeader">帶團者多一份</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            儲存設定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}