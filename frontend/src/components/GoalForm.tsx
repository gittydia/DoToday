import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { Goal } from "./GoalCard";

interface GoalFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (goal: Omit<Goal, 'id' | 'completions' | 'createdAt'>) => void;
  editingGoal?: Goal | null;
}

export function GoalForm({ open, onClose, onSave, editingGoal }: GoalFormProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    frequency: "daily" as "daily" | "weekly" | "monthly",
    targetCount: 1
  });

  useEffect(() => {
    if (editingGoal) {
      setForm({
        title: editingGoal.title,
        description: editingGoal.description || "",
        category: editingGoal.category,
        frequency: editingGoal.frequency,
        targetCount: editingGoal.targetCount
      });
    } else {
      setForm({
        title: "",
        description: "",
        category: "",
        frequency: "daily",
        targetCount: 1
      });
    }
  }, [editingGoal, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    setForm({
      title: "",
      description: "",
      category: "",
      frequency: "daily",
      targetCount: 1
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
          <DialogDescription>
            {editingGoal ? 'Update your goal details below.' : 'Set up a new goal to track your progress.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              placeholder="e.g., Drink 8 glasses of water"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any additional details about your goal..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={form.category} onValueChange={(value: string) => setForm({ ...form, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={form.frequency} onValueChange={(value: "daily" | "weekly" | "monthly") => setForm({ ...form, frequency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Target Count</Label>
            <Input
              id="target"
              type="number"
              min="1"
              value={form.targetCount}
              onChange={(e) => setForm({ ...form, targetCount: parseInt(e.target.value)})}
              required
            />
            <p className="text-xs text-muted-foreground">
              How many times per {form.frequency.slice(0, -2)} do you want to complete this goal?
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingGoal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}