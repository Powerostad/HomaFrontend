import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { StudioProject } from "../types/studio";

/**
 * StudioContext - manages studio mode and project state
 * Includes localStorage persistence for projects
 */
interface StudioContextType {
  studioMode: 'recommend' | 'tryon' | null;
  setStudioMode: (mode: 'recommend' | 'tryon' | null) => void;
  studioProjects: StudioProject[];
  addStudioProject: (project: StudioProject) => void;
  updateStudioProject: (id: string, updates: Partial<StudioProject>) => void;
  deleteStudioProject: (id: string) => void;
  getProjectById: (id: string) => StudioProject | undefined;
}

const STORAGE_KEY = "studioProjects";

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [studioMode, setStudioMode] = useState<'recommend' | 'tryon' | null>(null);
  const [studioProjects, setStudioProjects] = useState<StudioProject[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem(STORAGE_KEY);
      if (savedProjects) {
        setStudioProjects(JSON.parse(savedProjects));
      }
    } catch (error) {
      console.error("Error loading studio projects:", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Save to localStorage when projects change
  useEffect(() => {
    if (studioProjects.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(studioProjects));
      } catch (error) {
        console.error("Error saving studio projects:", error);
      }
    }
  }, [studioProjects]);

  const addStudioProject = (project: StudioProject) => {
    setStudioProjects(prev => [project, ...prev]);
  };

  const updateStudioProject = (id: string, updates: Partial<StudioProject>) => {
    setStudioProjects(prev => prev.map(p =>
      p.id === id ? { ...p, ...updates } : p
    ));
  };

  const deleteStudioProject = (id: string) => {
    setStudioProjects(prev => prev.filter(p => p.id !== id));
  };

  const getProjectById = (id: string) => {
    return studioProjects.find(p => p.id === id);
  };

  return (
    <StudioContext.Provider
      value={{
        studioMode,
        setStudioMode,
        studioProjects,
        addStudioProject,
        updateStudioProject,
        deleteStudioProject,
        getProjectById,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error("useStudio must be used within a StudioProvider");
  }
  return context;
}
