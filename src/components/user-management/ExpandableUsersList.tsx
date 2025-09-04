import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Edit, UserMinus, Trash2, Phone, Mail, Calendar } from 'lucide-react';
import { type AppUser } from '@/services/userService';
import CompleteDeleteDialog from './CompleteDeleteDialog';
import { useTimezone } from '@/hooks/useTimezone';

interface ExpandableUsersListProps {
  users: AppUser[];
  currentUser: AppUser | null;
  onEditUser: (user: AppUser) => void;
  onDeleteUser: (id: string, name: string) => void;
  onCompleteDeleteUser: (id: string, name: string) => void;
  onToggleStatus: (id: string, name: string) => void;
  isToggling: boolean;
  isDeleting: boolean;
  isCompleteDeleting: boolean;
}

const ExpandableUsersList: React.FC<ExpandableUsersListProps> = ({
  users,
  currentUser,
  onEditUser,
  onDeleteUser,
  onCompleteDeleteUser,
  onToggleStatus,
  isToggling,
  isDeleting,
  isCompleteDeleting
}) => {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const { formatDateInput } = useTimezone();
  const [completeDeleteDialog, setCompleteDeleteDialog] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
  }>({
    isOpen: false,
    userId: '',
    userName: ''
  });

  const toggleExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrador',
      manager: 'Gerente',
      worker: 'Trabajador'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      worker: 'bg-green-100 text-green-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatPhone = (phone: string) => {
    if (!phone) return 'No registrado';
    return phone;
  };

  const handleCompleteDeleteClick = (userId: string, userName: string) => {
    setCompleteDeleteDialog({
      isOpen: true,
      userId,
      userName
    });
  };

  const handleCompleteDeleteConfirm = () => {
    onCompleteDeleteUser(completeDeleteDialog.userId, completeDeleteDialog.userName);
    setCompleteDeleteDialog({
      isOpen: false,
      userId: '',
      userName: ''
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema ({users.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {users.map((user) => {
            const isExpanded = expandedUsers.has(user.id);
            return (
              <Collapsible key={user.id} open={isExpanded} onOpenChange={() => toggleExpanded(user.id)}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between p-3 h-auto hover:bg-gray-50 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2 flex-1">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm break-words">{user.name}</div>
                        </div>
                      </div>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="px-3 pb-3">
                  <div className="mt-3 space-y-4 border-l-2 border-gray-100 pl-4 ml-2">
                    {/* User Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{formatPhone(user.phone)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          Registrado: {formatDateInput(new Date(user.created_at).toISOString().split('T')[0])}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Rol:</span>
                          <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className="text-xs text-gray-600">
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Toggle */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Estado del Usuario</span>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={() => onToggleStatus(user.id, user.name)}
                          disabled={currentUser?.id === user.id || isToggling}
                        />
                        <span className="text-sm">
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        onClick={() => onEditUser(user)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-8 h-8 p-0"
                        title="Editar usuario"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => onDeleteUser(user.id, user.name)}
                        variant="ghost"
                        size="sm"
                        disabled={currentUser?.id === user.id || isDeleting}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 w-8 h-8 p-0"
                        title="Eliminar de la app (puede reaparecer)"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleCompleteDeleteClick(user.id, user.name)}
                        variant="ghost"
                        size="sm"
                        disabled={currentUser?.id === user.id || isCompleteDeleting}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 w-8 h-8 p-0"
                        title="Eliminar completamente (permanente)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>

      <CompleteDeleteDialog
        isOpen={completeDeleteDialog.isOpen}
        onOpenChange={(open) => setCompleteDeleteDialog(prev => ({ ...prev, isOpen: open }))}
        onConfirm={handleCompleteDeleteConfirm}
        userName={completeDeleteDialog.userName}
        isDeleting={isCompleteDeleting}
      />
    </>
  );
};

export default ExpandableUsersList;