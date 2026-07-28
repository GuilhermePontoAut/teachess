import assert from "node:assert/strict";
import test from "node:test";
import type {
  AnalysisRepository,
  ChessEngineAnalyzer,
  PedagogicalReportGenerator,
} from "./services";

test("serviços de análise aceitam implementações falsas sem dependência da UI", () => {
  const engine: ChessEngineAnalyzer = {
    async analyzePosition() {
      throw new Error("fake engine");
    },
    async analyzeGame() {
      throw new Error("fake engine");
    },
  };
  const generator: PedagogicalReportGenerator = {
    async generate() {
      throw new Error("fake generator");
    },
  };
  const repository: AnalysisRepository = {
    async saveJob() {},
    async findJobById() {
      return null;
    },
    async saveGameAnalysis() {},
    async savePedagogicalReport() {},
  };

  assert.equal(typeof engine.analyzeGame, "function");
  assert.equal(typeof generator.generate, "function");
  assert.equal(typeof repository.saveJob, "function");
});
