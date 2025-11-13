import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { printService, type PrintAnimalData } from '@/services/printService';
import { useToast } from '@/hooks/use-toast';

interface AnimalPrintButtonProps {
  animal: PrintAnimalData;
}

export function AnimalPrintButton({ animal }: AnimalPrintButtonProps) {
  const { toast } = useToast();

  const handlePrint = async () => {
    try {
      await printService.printAnimalRecord(animal);
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print Failed",
        description: "Failed to generate print preview. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button onClick={handlePrint} variant="outline" size="sm">
      <Printer className="h-4 w-4 mr-2" />
      Print Record
    </Button>
  );
}
