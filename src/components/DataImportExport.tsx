import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, FileText, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAnimalStore, type Animal } from "@/stores/animalStore";
import { getAllAnimals, addAnimal } from "@/services/animalService";

interface DataImportExportProps {
  onImportComplete?: () => void;
}

const DataImportExport: React.FC<DataImportExportProps> = ({ onImportComplete }) => {
  const { toast } = useToast();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const animals = useAnimalStore((state) => state.animals);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setImportFile(event.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to import.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const text = await importFile.text();
      const jsonData = JSON.parse(text);

      if (!Array.isArray(jsonData)) {
        throw new Error("The file content is not a valid JSON array.");
      }

      // Validate each item in the JSON array
      for (const item of jsonData) {
        if (
          typeof item.name !== 'string' ||
          typeof item.tag !== 'string' ||
          typeof item.species !== 'string' ||
          typeof item.breed !== 'string' ||
          typeof item.birthDate !== 'string' ||
          typeof item.gender !== 'string' ||
          typeof item.weight !== 'string' ||
          typeof item.color !== 'string' ||
          typeof item.motherId !== 'string' ||
          typeof item.fatherId !== 'string' ||
          typeof item.healthStatus !== 'string' ||
          typeof item.notes !== 'string'
        ) {
          throw new Error("One or more items in the JSON array have invalid data.");
        }
      }

      // Add animals to Supabase
      for (const animalData of jsonData) {
        await addAnimal({
          name: animalData.name,
          tag: animalData.tag,
          species: animalData.species,
          breed: animalData.breed,
          birthDate: animalData.birthDate,
          gender: animalData.gender,
          weight: animalData.weight,
          color: animalData.color,
          motherId: animalData.motherId,
          fatherId: animalData.fatherId,
          healthStatus: animalData.healthStatus,
          notes: animalData.notes,
          image: animalData.image || null,
          maternal_grandmother_id: animalData.maternal_grandmother_id || '',
          maternal_grandfather_id: animalData.maternal_grandfather_id || '',
          paternal_grandmother_id: animalData.paternal_grandmother_id || '',
          paternal_grandfather_id: animalData.paternal_grandfather_id || '',
        });
      }

      toast({
        title: "Import successful",
        description: `Successfully imported ${jsonData.length} animals.`,
      });

      // Notify the parent component that the import is complete
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error: any) {
      console.error("Error importing data:", error);
      toast({
        title: "Import failed",
        description: `Failed to import data. ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportFile(null);
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    const dataStr = JSON.stringify(animals, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileName = 'animal_data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);

    setIsExporting(false);
    toast({
      title: "Export successful",
      description: "Successfully exported animal data to animal_data.json.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Import/Export</CardTitle>
        <CardDescription>
          Import or export your animal data as a JSON file.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center space-x-4">
          <Label htmlFor="import" className="w-40 text-right">
            Import Data:
          </Label>
          <Input
            type="file"
            id="import"
            accept=".json"
            onChange={handleFileChange}
            disabled={isImporting}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            disabled={isImporting || !importFile}
          >
            {isImporting ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </>
            )}
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <Label htmlFor="export" className="w-40 text-right">
            Export Data:
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Download className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataImportExport;
