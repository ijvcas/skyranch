import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, User, Building2, Users, Landmark, Edit, Trash2, Search } from 'lucide-react';
import { ParcelOwner } from '@/services/parcelOwnersService';
import PermissionGuard from '@/components/PermissionGuard';
import { useState } from 'react';
import { SimilarOwnersDialog } from './SimilarOwnersDialog';

const OWNER_TYPE_ICONS = {
  individual: User,
  company: Building2,
  cooperative: Users,
  government: Landmark,
};

const OWNER_TYPE_LABELS = {
  individual: 'Individual',
  company: 'Empresa',
  cooperative: 'Cooperativa',
  government: 'Gobierno',
};

interface OwnerContactCardProps {
  owner: ParcelOwner;
  onEdit?: (owner: ParcelOwner) => void;
  onDelete?: (ownerId: string) => void;
  showActions?: boolean;
  showSimilarityAnalysis?: boolean;
}

export const OwnerContactCard: React.FC<OwnerContactCardProps> = ({
  owner,
  onEdit,
  onDelete,
  showActions = true,
  showSimilarityAnalysis = true,
}) => {
  const IconComponent = OWNER_TYPE_ICONS[owner.owner_type];
  const [showSimilarityDialog, setShowSimilarityDialog] = useState(false);

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_self');
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconComponent className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-medium text-foreground">{owner.owner_name}</h4>
            {owner.is_primary_contact && (
              <Badge variant="secondary" className="text-xs">
                Contacto Principal
              </Badge>
            )}
          </div>
          
          <div className="flex gap-1">
            {showSimilarityAnalysis && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSimilarityDialog(true)}
                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
                title="Analizar propietarios similares"
              >
                <Search className="w-3 h-3" />
              </Button>
            )}
            
            {showActions && (
              <PermissionGuard permission="cadastral_edit" fallback={null} showError={false}>
                <>
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(owner)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(owner.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </>
              </PermissionGuard>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {OWNER_TYPE_LABELS[owner.owner_type]}
            </Badge>
            <span className="text-muted-foreground">
              {owner.ownership_percentage}% propiedad
            </span>
          </div>

          {owner.contact_phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3 text-muted-foreground" />
              <button
                onClick={() => handleCall(owner.contact_phone!)}
                className="text-primary hover:underline"
              >
                {owner.contact_phone}
              </button>
            </div>
          )}

          {owner.contact_email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3 text-muted-foreground" />
              <button
                onClick={() => handleEmail(owner.contact_email!)}
                className="text-primary hover:underline"
              >
                {owner.contact_email}
              </button>
            </div>
          )}

          {owner.contact_address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">{owner.contact_address}</span>
            </div>
          )}

          {owner.identification_number && (
            <div className="text-xs text-muted-foreground">
              ID: {owner.identification_number}
            </div>
          )}

          {owner.notes && (
            <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
              {owner.notes}
            </div>
          )}
        </div>
      </CardContent>

      <SimilarOwnersDialog
        owner={owner}
        open={showSimilarityDialog}
        onClose={() => setShowSimilarityDialog(false)}
      />
    </Card>
  );
};