import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserManual } from "@/components/help/UserManual";
import { ArrowLeft, Download, Printer, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Manual() {
  const manualRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = async () => {
    if (!manualRef.current) return;

    setIsGenerating(true);
    toast({
      title: "Gerando PDF...",
      description: "Aguarde enquanto o manual é preparado para download.",
    });

    try {
      const element = manualRef.current;
      
      // Create canvas from the manual content
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      
      // Calculate PDF dimensions (A4)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = pdfWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;
      
      let heightLeft = scaledHeight;
      let position = 0;
      let page = 1;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = -pdfHeight * page;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;
        page++;
      }

      // Download the PDF
      const fileName = `Manual_OBD-II_Scanner_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF Gerado!",
        description: `O arquivo "${fileName}" foi baixado com sucesso.`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Tente novamente ou use a opção de impressão.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Hide on print */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border safe-area-top print:hidden">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="h-10 w-10">
              <Link to="/ajuda">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Manual de Uso</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </Button>
            <Button
              size="sm"
              onClick={generatePDF}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Baixar PDF</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Manual Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden print:shadow-none print:border-0">
          <UserManual ref={manualRef} />
        </div>
        
        {/* Actions - Hide on print */}
        <div className="flex justify-center gap-4 mt-6 print:hidden">
          <Button variant="outline" asChild>
            <Link to="/ajuda">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar à Ajuda
            </Link>
          </Button>
          <Button onClick={generatePDF} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Baixar Manual (PDF)
          </Button>
        </div>
      </main>
    </div>
  );
}
