import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calculator, 
  Type, 
  Code, 
  Palette, 
  QrCode, 
  Hash,
  Search,
  FileText,
  Zap
} from "lucide-react";

const Tools = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // 工具數據
  const toolCategories = [
    {
      id: "text",
      name: "文字處理工具",
      icon: <Type className="w-5 h-5" />,
      tools: [
        {
          id: "word-counter",
          name: "文字計數器",
          description: "統計字數、字元數、行數等",
          icon: <FileText className="w-4 h-4" />,
          component: <WordCounterTool />
        },
        {
          id: "text-converter",
          name: "繁簡轉換",
          description: "繁體中文與簡體中文互轉",
          icon: <Type className="w-4 h-4" />,
          component: <TextConverterTool />
        }
      ]
    },
    {
      id: "dev",
      name: "開發者工具", 
      icon: <Code className="w-5 h-5" />,
      tools: [
        {
          id: "json-formatter",
          name: "JSON 格式化",
          description: "美化和驗證 JSON 格式",
          icon: <Code className="w-4 h-4" />,
          component: <JSONFormatterTool />
        },
        {
          id: "qr-generator",
          name: "QR Code 生成器",
          description: "文字轉 QR Code 圖片",
          icon: <QrCode className="w-4 h-4" />,
          component: <QRGeneratorTool />
        }
      ]
    },
    {
      id: "calc",
      name: "計算工具",
      icon: <Calculator className="w-5 h-5" />,
      tools: [
        {
          id: "calculator",
          name: "多功能計算器",
          description: "基本運算與科學計算",
          icon: <Calculator className="w-4 h-4" />,
          component: <CalculatorTool />
        }
      ]
    },
    {
      id: "color",
      name: "顏色工具",
      icon: <Palette className="w-5 h-5" />,
      tools: [
        {
          id: "color-picker",
          name: "顏色選擇器",
          description: "RGB、HEX、HSL 格式轉換",
          icon: <Palette className="w-4 h-4" />,
          component: <ColorPickerTool />
        }
      ]
    }
  ];

  // 篩選工具
  const filteredCategories = toolCategories.map(category => ({
    ...category,
    tools: category.tools.filter(tool =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.tools.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-800">實用工具箱</h1>
          </div>
          <p className="text-slate-600">為團隊成員提供便利的在線工具</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="搜尋工具..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tools Grid */}
        <div className="space-y-8">
          {filteredCategories.map(category => (
            <div key={category.id}>
              <div className="flex items-center gap-2 mb-4">
                {category.icon}
                <h2 className="text-xl font-semibold text-slate-800">{category.name}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.tools.map(tool => (
                  <Card key={tool.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="text-center pb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        {tool.icon}
                      </div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-slate-600 mb-4">{tool.description}</p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full">開始使用</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{tool.name}</DialogTitle>
                          </DialogHeader>
                          {tool.component}
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">找不到符合條件的工具</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 文字計數器組件
const WordCounterTool = () => {
  const [text, setText] = useState("");
  
  const stats = {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text.split('\n').length,
    paragraphs: text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="請輸入要統計的文字..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
      />
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.characters}</div>
            <div className="text-sm text-slate-600">字元數</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.charactersNoSpaces}</div>
            <div className="text-sm text-slate-600">字元數（無空格）</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.words}</div>
            <div className="text-sm text-slate-600">單字數</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.lines}</div>
            <div className="text-sm text-slate-600">行數</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.paragraphs}</div>
            <div className="text-sm text-slate-600">段落數</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// 文字轉換器組件
const TextConverterTool = () => {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");

  const traditionalMap = new Map([
    ['简', '簡'], ['体', '體'], ['为', '為'], ['来', '來'], ['这', '這'],
    ['会', '會'], ['时', '時'], ['过', '過'], ['说', '說'], ['学', '學']
  ]);

  const convertToTraditional = () => {
    let result = inputText;
    traditionalMap.forEach((traditional, simplified) => {
      result = result.replace(new RegExp(simplified, 'g'), traditional);
    });
    setOutputText(result);
  };

  const convertToSimplified = () => {
    let result = inputText;
    traditionalMap.forEach((traditional, simplified) => {
      result = result.replace(new RegExp(traditional, 'g'), simplified);
    });
    setOutputText(result);
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="請輸入要轉換的文字..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        rows={6}
      />
      
      <div className="flex gap-2">
        <Button onClick={convertToTraditional} className="flex-1">
          轉為繁體
        </Button>
        <Button onClick={convertToSimplified} variant="outline" className="flex-1">
          轉為簡體
        </Button>
      </div>
      
      <Textarea
        placeholder="轉換結果..."
        value={outputText}
        readOnly
        rows={6}
      />
    </div>
  );
};

// JSON 格式化組件
const JSONFormatterTool = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError("");
    } catch (err) {
      setError(`JSON 格式錯誤: ${err.message}`);
    }
  };

  const minifyJSON = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError("");
    } catch (err) {
      setError(`JSON 格式錯誤: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="請輸入 JSON 文字..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={8}
        className="font-mono"
      />
      
      <div className="flex gap-2">
        <Button onClick={formatJSON}>格式化</Button>
        <Button onClick={minifyJSON} variant="outline">壓縮</Button>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      <Textarea
        placeholder="格式化結果..."
        value={output}
        readOnly
        rows={8}
        className="font-mono"
      />
    </div>
  );
};

// QR Code 生成器組件
const QRGeneratorTool = () => {
  const [text, setText] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  const generateQR = () => {
    if (text.trim()) {
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
      setQrUrl(url);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="請輸入要生成 QR Code 的文字或網址..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && generateQR()}
      />
      
      <Button onClick={generateQR} className="w-full">
        生成 QR Code
      </Button>
      
      {qrUrl && (
        <div className="text-center">
          <img src={qrUrl} alt="QR Code" className="mx-auto border rounded-lg" />
          <p className="text-sm text-slate-600 mt-2">右鍵點擊圖片保存</p>
        </div>
      )}
    </div>
  );
};

// 計算器組件
const CalculatorTool = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  const calculate = () => {
    try {
      // 簡單的計算（實際應用中應使用更安全的方式）
      const safeInput = input.replace(/[^0-9+\-*/.() ]/g, '');
      const calculatedResult = Function('"use strict"; return (' + safeInput + ')')();
      const historyEntry = `${input} = ${calculatedResult}`;
      
      setResult(calculatedResult.toString());
      setHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
    } catch (error) {
      setResult("計算錯誤");
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="請輸入算式，例如：2 + 3 * 4"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && calculate()}
        className="font-mono text-lg"
      />
      
      <Button onClick={calculate} className="w-full">
        計算
      </Button>
      
      {result && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm text-slate-600">結果</div>
              <div className="text-2xl font-bold text-blue-600">{result}</div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">計算歷史</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {history.map((entry, index) => (
                <div key={index} className="text-sm font-mono text-slate-600">
                  {entry}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// 顏色選擇器組件
const ColorPickerTool = () => {
  const [color, setColor] = useState("#007bff");

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h = h! / 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">選擇顏色</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-16 border rounded-lg cursor-pointer"
          />
        </div>
        
        <div 
          className="h-16 border rounded-lg"
          style={{ backgroundColor: color }}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-600 mb-1">HEX</div>
            <div 
              className="font-mono text-lg cursor-pointer hover:bg-slate-100 p-1 rounded"
              onClick={() => copyToClipboard(color.toUpperCase())}
            >
              {color.toUpperCase()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-600 mb-1">RGB</div>
            <div 
              className="font-mono text-lg cursor-pointer hover:bg-slate-100 p-1 rounded"
              onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}
            >
              {rgb.r}, {rgb.g}, {rgb.b}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-600 mb-1">HSL</div>
            <div 
              className="font-mono text-lg cursor-pointer hover:bg-slate-100 p-1 rounded"
              onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}
            >
              {hsl.h}°, {hsl.s}%, {hsl.l}%
            </div>
          </CardContent>
        </Card>
      </div>
      
      <p className="text-sm text-slate-600 text-center">點擊色值可複製到剪貼簿</p>
    </div>
  );
};

export default Tools;