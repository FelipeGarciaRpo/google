"use client";

import { useEffect, useState } from "react";
import ky from "ky";

import type { AvailableAiModel } from "../models";

// Fetched once per page load and shared by every selector
let modelsPromise: Promise<AvailableAiModel[] | null> | null = null;

const loadModels = () => {
  modelsPromise ??= ky
    .get("/api/models")
    .json<{ models: AvailableAiModel[] }>()
    .then((response) => response.models)
    .catch(() => {
      modelsPromise = null;
      return null;
    });

  return modelsPromise;
};

export const useAvailableModels = () => {
  const [models, setModels] = useState<AvailableAiModel[] | null>(null);

  useEffect(() => {
    let active = true;
    loadModels().then((result) => {
      if (active && result) setModels(result);
    });
    return () => {
      active = false;
    };
  }, []);

  return models;
};
