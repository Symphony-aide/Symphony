/**
 * Markdown Parser for Evaluation Data
 * 
 * Parses AGREEMENT.md files back to evaluation data structures.
 */

import type {
  AgreementDocument,
  AgreementHeader,
  FeatureIdentificationSection,
  ComponentSummary,
  ProductionReadinessStatus,
  PriorityAction,
} from '../../types/documents';
import type {
  FeatureEvaluation,
  CompletenessEvaluation,
  CodeQualityEvaluation,
  DocumentationEvaluation,
  ReliabilityEvaluation,
  PerformanceEvaluation,
  IntegrationEvaluation,
  MaintenanceEvaluation,
  StressCollapseEvaluation,
  CapabilityStatus,
  FeatureIsolationClassification,
  AntiPattern,
  GoodPractice,
  ModificationEaseClassification,
  TestabilityClassification,
  StressCollapseCondition,
} from '../../types/dimensions';
import type { AtomicFeature, CodeEvidence, ExternalDependency } from '../../types/evaluation';

/**
 * Parses markdown evaluation documents back to data structures
 */
export class MarkdownParser {
  /**
   * Parse a complete AGREEMENT.md document
   */
  static parseAgreement(markdown: string): AgreementDocument {
    const sections = this.splitSections(markdown);

    const header = this.parseHeader(sections.header);
    const featureIdentification = this.parseFeatureIdentification(sections.featureIdentification);
    const featureEvaluations = this.parseFeatureEvaluations(sections.featureEvaluations, featureIdentification.featuresTable);
    const componentSummary = this.parseComponentSummary(sections.componentSummary);

    return {
      header,
      featureIdentification,
      featureEvaluations,
      componentSummary,
    };
  }

  /**
   * Split markdown into major sections
   */
  private static splitSections(markdown: string): {
    header: string;
    featureIdentification: string;
    featureEvaluations: string;
    componentSummary: string;
  } {
    const lines = markdown.split('\n');
    let currentSection = 'header';
    const sections: Record<string, string[]> = {
      header: [],
      featureIdentification: [],
      featureEvaluations: [],
      componentSummary: [],
    };

    for (const line of lines) {
      if (line.startsWith('## Atomic Feature Identification')) {
        currentSection = 'featureIdentification';
      } else if (line.startsWith('## Feature-by-Feature Evaluation')) {
        currentSection = 'featureEvaluations';
      } else if (line.startsWith('## Component-Level Summary')) {
        currentSection = 'componentSummary';
      }
      sections[currentSection].push(line);
    }

    return {
      header: sections.header.join('\n'),
      featureIdentification: sections.featureIdentification.join('\n'),
      featureEvaluations: sections.featureEvaluations.join('\n'),
      componentSummary: sections.componentSummary.join('\n'),
    };
  }

  /**
   * Parse the header section
   */
  static parseHeader(headerText: string): AgreementHeader {
    const lines = headerText.split('\n');

    // Extract component name from title
    const titleMatch = lines[0]?.match(/^# (.+) - Evaluation Agreement/);
    const componentName = titleMatch?.[1] || 'Unknown';

    // Extract metadata
    const typeMatch = headerText.match(/\*\*Type:\*\* (Component|Feature Package)/);
    const dateMatch = headerText.match(/\*\*Evaluated:\*\* (.+)/);
    const pathMatch = headerText.match(/\*\*Path:\*\* (.+)/);
    const locMatch = headerText.match(/\*\*Lines of Code:\*\* (\d+)/);

    return {
      componentName,
      type: (typeMatch?.[1] as 'Component' | 'Feature Package') || 'Component',
      evaluatedDate: dateMatch?.[1]?.trim() || new Date().toISOString().split('T')[0],
      path: pathMatch?.[1]?.trim() || '',
      linesOfCode: parseInt(locMatch?.[1] || '0', 10),
    };
  }

  /**
   * Parse the feature identification section
   */
  static parseFeatureIdentification(sectionText: string): FeatureIdentificationSection {
    const methodology: string[] = [];
    const featuresTable: AtomicFeature[] = [];
    const externalDependencies: ExternalDependency[] = [];

    // Parse methodology
    const methodologyMatch = sectionText.match(/\*\*Methodology:\*\*\n([\s\S]*?)(?=\n\*\*|$)/);
    if (methodologyMatch) {
      const methodLines = methodologyMatch[1].split('\n').filter(l => l.match(/^\d+\./));
      for (const line of methodLines) {
        const stepMatch = line.match(/^\d+\.\s*(.+)/);
        if (stepMatch) {
          methodology.push(stepMatch[1].trim());
        }
      }
    }

    // Parse features table
    const tableMatch = sectionText.match(/\| # \| Feature Name[\s\S]*?\n((?:\|[\s\S]*?\n)*)/);
    if (tableMatch) {
      const tableRows = tableMatch[1].split('\n').filter(l => l.startsWith('|') && !l.includes('---'));
      for (const row of tableRows) {
        const cells = row.split('|').map(c => c.trim()).filter(c => c);
        if (cells.length >= 5) {
          const locationMatch = cells[4].match(/(.+):(\d+)-(\d+)/);
          featuresTable.push({
            id: parseInt(cells[0], 10),
            name: cells[1],
            description: cells[2],
            linesOfCode: parseInt(cells[3].replace('~', ''), 10),
            primaryLocation: {
              file: locationMatch?.[1] || '',
              startLine: parseInt(locationMatch?.[2] || '0', 10),
              endLine: parseInt(locationMatch?.[3] || '0', 10),
            },
            codeBlocks: [],
            stateManagement: [],
            eventHandlers: [],
          });
        }
      }
    }

    // Parse total features
    const totalMatch = sectionText.match(/\*\*Total Atomic Features Identified:\*\* (\d+)/);
    const totalFeatures = parseInt(totalMatch?.[1] || String(featuresTable.length), 10);

    // Parse external dependencies
    const depsMatch = sectionText.match(/\*\*External Dependencies[\s\S]*?:\*\*\n([\s\S]*?)(?=\n\*\*|$)/);
    if (depsMatch) {
      const depLines = depsMatch[1].split('\n').filter(l => l.startsWith('-'));
      for (const line of depLines) {
        const depMatch = line.match(/- (.+?) - (.+?) \(NOT evaluated/);
        if (depMatch) {
          externalDependencies.push({
            packageName: depMatch[1].trim(),
            purpose: depMatch[2].trim(),
            importPath: depMatch[1].trim(),
          });
        }
      }
    }

    return {
      methodology,
      featuresTable,
      totalFeatures,
      externalDependencies,
    };
  }

  /**
   * Parse all feature evaluations
   */
  static parseFeatureEvaluations(sectionText: string, features: AtomicFeature[]): FeatureEvaluation[] {
    const evaluations: FeatureEvaluation[] = [];

    // Split by feature headers
    const featureSections = sectionText.split(/(?=### Feature \d+:)/);

    for (const featureSection of featureSections) {
      if (!featureSection.trim() || !featureSection.includes('### Feature')) continue;

      const featureIdMatch = featureSection.match(/### Feature (\d+):/);
      const featureId = parseInt(featureIdMatch?.[1] || '0', 10);
      const feature = features.find(f => f.id === featureId);

      if (!feature) continue;

      evaluations.push({
        feature,
        completeness: this.parseCompleteness(featureSection, featureId),
        codeQuality: this.parseCodeQuality(featureSection, featureId),
        documentation: this.parseDocumentation(featureSection, featureId),
        reliability: this.parseReliability(featureSection, featureId),
        performance: this.parsePerformance(featureSection, featureId),
        integration: this.parseIntegration(featureSection, featureId),
        maintenance: this.parseMaintenance(featureSection, featureId),
        stressCollapse: this.parseStressCollapse(featureSection, featureId),
      });
    }

    return evaluations;
  }

  /**
   * Parse completeness evaluation
   */
  static parseCompleteness(sectionText: string, featureId: number): CompletenessEvaluation {
    const dimMatch = sectionText.match(new RegExp(`#### ${featureId}\\.1 Feature Completeness: (.+?) - (\\d+)%`));
    const rating = (dimMatch?.[1] || 'Partial') as CompletenessEvaluation['rating'];
    const percentage = parseInt(dimMatch?.[2] || '50', 10);

    const implemented: CapabilityStatus[] = [];
    const missing: CapabilityStatus[] = [];
    const incomplete: CapabilityStatus[] = [];

    // Parse implemented
    const implMatch = sectionText.match(/✅ \*\*Implemented:\*\*\n([\s\S]*?)(?=\n[❌⚠️\*]|\n\n)/);
    if (implMatch) {
      const items = implMatch[1].split('\n').filter(l => l.startsWith('-'));
      for (const item of items) {
        implemented.push({ capability: item.replace(/^-\s*/, '').trim(), status: 'implemented' });
      }
    }

    // Parse missing
    const missMatch = sectionText.match(/❌ \*\*Missing:\*\*\n([\s\S]*?)(?=\n[✅⚠️\*]|\n\n)/);
    if (missMatch) {
      const items = missMatch[1].split('\n').filter(l => l.startsWith('-'));
      for (const item of items) {
        missing.push({ capability: item.replace(/^-\s*/, '').trim(), status: 'missing' });
      }
    }

    // Parse incomplete
    const incMatch = sectionText.match(/⚠️ \*\*Incomplete:\*\*\n([\s\S]*?)(?=\n[✅❌\*]|\n\n)/);
    if (incMatch) {
      const items = incMatch[1].split('\n').filter(l => l.startsWith('-'));
      for (const item of items) {
        const parts = item.replace(/^-\s*/, '').split(' - ');
        incomplete.push({
          capability: parts[0].trim(),
          status: 'incomplete',
          details: parts[1]?.trim(),
        });
      }
    }

    const evidence = this.parseCodeEvidence(sectionText, `${featureId}.1`);
    const rationaleMatch = sectionText.match(/\*\*Rationale for Rating:\*\*\n([\s\S]*?)(?=\n---|\n####|$)/);

    return {
      rating,
      percentage,
      implemented,
      missing,
      incomplete,
      evidence,
      rationale: rationaleMatch?.[1]?.trim() || '',
    };
  }

  /**
   * Parse code quality evaluation
   */
  static parseCodeQuality(sectionText: string, featureId: number): CodeQualityEvaluation {
    const dimMatch = sectionText.match(new RegExp(`#### ${featureId}\\.2 Code Quality / Maintainability: (.+)`));
    const rating = (dimMatch?.[1]?.trim() || 'Basic') as CodeQualityEvaluation['rating'];

    // Parse feature isolation
    let featureIsolation: FeatureIsolationClassification = 'mixed_with_other';
    if (sectionText.includes('[x] ✅ Feature isolated in separate module/hook')) {
      featureIsolation = 'isolated_module';
    } else if (sectionText.includes('[x] ⚠️ Feature in same file, clearly separated')) {
      featureIsolation = 'same_file_separated';
    } else if (sectionText.includes('[x] ❌ Feature scattered across multiple files')) {
      featureIsolation = 'scattered_files';
    }

    // Parse anti-patterns (simplified)
    const antiPatterns: AntiPattern[] = [];
    const apMatches = sectionText.matchAll(/\*\*#(\d+): (.+?)\*\*/g);
    for (const match of apMatches) {
      antiPatterns.push({
        id: parseInt(match[1], 10),
        name: match[2],
        evidence: this.createDefaultEvidence(),
        issue: '',
        impact: '',
        betterApproach: { description: '', codeExample: '' },
      });
    }

    // Parse good practices
    const goodPractices: GoodPractice[] = [];
    const gpMatch = sectionText.match(/\*\*Good Practices Observed:\*\*\n([\s\S]*?)(?=\n\*\*|$)/);
    if (gpMatch) {
      const items = gpMatch[1].split('\n').filter(l => l.includes('✅'));
      for (const item of items) {
        const parts = item.replace(/^-\s*✅\s*/, '').split(':');
        goodPractices.push({
          name: parts[0]?.trim() || '',
          evidence: this.createDefaultEvidence(),
          description: parts[1]?.trim() || '',
        });
      }
    }

    const assessmentMatch = sectionText.match(/\*\*Overall Code Quality Assessment:\*\*\n([\s\S]*?)(?=\n---|\n####|$)/);

    return {
      rating,
      featureIsolation,
      antiPatterns,
      goodPractices,
      assessment: assessmentMatch?.[1]?.trim() || '',
    };
  }

  /**
   * Parse documentation evaluation
   */
  static parseDocumentation(sectionText: string, featureId: number): DocumentationEvaluation {
    const dimMatch = sectionText.match(new RegExp(`#### ${featureId}\\.3 Documentation & Comments: (.+)`));
    const rating = (dimMatch?.[1]?.trim() || 'Basic') as DocumentationEvaluation['rating'];

    const coverage = {
      hasJSDoc: sectionText.includes('[x] JSDoc/TSDoc'),
      hasInlineComments: sectionText.includes('[x] Inline comments'),
      hasSelfDocumentingNames: sectionText.includes('[x] Self-documenting'),
      hasUsageExamples: sectionText.includes('[x] Usage examples'),
      hasEdgeCaseDocs: sectionText.includes('[x] Edge cases'),
    };

    const assessmentMatch = sectionText.match(/\*\*Assessment:\*\*\n([\s\S]*?)(?=\n---|\n####|$)/);

    return {
      rating,
      coverage,
      examples: { goodDocumentation: [], missingDocumentation: [] },
      assessment: assessmentMatch?.[1]?.trim() || '',
    };
  }

  /**
   * Parse reliability evaluation
   */
  static parseReliability(sectionText: string, featureId: number): ReliabilityEvaluation {
    const dimMatch = sectionText.match(new RegExp(`#### ${featureId}\\.4 Reliability / Fault-Tolerance: (.+)`));
    const rating = (dimMatch?.[1]?.trim() || 'Medium') as ReliabilityEvaluation['rating'];

    const assessmentMatch = sectionText.match(/#### \d+\.4[\s\S]*?\*\*Assessment:\*\*\n([\s\S]*?)(?=\n---|\n####|$)/);

    return {
      rating,
      presentErrorHandling: [],
      missingErrorHandling: [],
      defensiveCoding: {
        hasInputValidation: false,
        hasNullChecks: false,
        hasTypeGuards: false,
        description: '',
      },
      edgeCaseHandling: {
        handledCases: [],
        unhandledCases: [],
        description: '',
      },
      assessment: assessmentMatch?.[1]?.trim() || '',
    };
  }

  /**
   * Parse performance evaluation
   */
  static parsePerformance(sectionText: string, featureId: number): PerformanceEvaluation {
    const dimMatch = sectionText.match(new RegExp(`#### ${featureId}\\.5 Performance & Efficiency: (.+)`));
    const rating = (dimMatch?.[1]?.trim() || 'Acceptable') as PerformanceEvaluation['rating'];

    const complexityMatch = sectionText.match(/Algorithmic Complexity: (.+)/);
    const loopMatch = sectionText.match(/Loop Analysis: (.+)/);

    const assessmentMatch = sectionText.match(/#### \d+\.5[\s\S]*?\*\*Assessment:\*\*\n([\s\S]*?)(?=\n---|\n####|$)/);

    return {
      rating,
      concerns: [],
      optimizations: [],
      complexityAnalysis: {
        algorithmicComplexity: complexityMatch?.[1]?.trim() || 'O(n)',
        loopAnalysis: loopMatch?.[1]?.trim() || 'No nested loops',
      },
      reRenderAnalysis: {
        hasUnnecessaryReRenders: false,
        issues: [],
      },
      assessment: assessmentMatch?.[1]?.trim() || '',
    };
  }

  /**
   * Parse integration evaluation
   */
  static parseIntegration(sectionText: string, featureId: number): IntegrationEvaluation {
    const dimMatch = sectionText.match(new RegExp(`#### ${featureId}\\.6 Integration & Extensibility: (.+)`));
    const rating = (dimMatch?.[1]?.trim() || 'Partial') as IntegrationEvaluation['rating'];

    const toggleMatch = sectionText.match(/\*\*Toggle Capability:\*\* (Yes|No)/);

    const assessmentMatch = sectionText.match(/#### \d+\.6[\s\S]*?\*\*Assessment:\*\*\n([\s\S]*?)(?=\n---|\n####|$)/);

    return {
      rating,
      configurationOptions: [],
      extensibility: {
        hasHooksCallbacks: sectionText.includes('[x] ✅ Hooks/callbacks'),
        hasSomeExtensionPoints: sectionText.includes('[x] ⚠️ Some extension points'),
        isHardcoded: sectionText.includes('[x] ❌ Hardcoded'),
        details: '',
      },
      toggleCapability: toggleMatch?.[1] === 'Yes',
      featureInteractions: '',
      assessment: assessmentMatch?.[1]?.trim() || '',
    };
  }

  /**
   * Parse maintenance evaluation
   */
  static parseMaintenance(sectionText: string, featureId: number): MaintenanceEvaluation {
    const dimMatch = sectionText.match(new RegExp(`#### ${featureId}\\.7 Maintenance & Support: (.+)`));
    const rating = (dimMatch?.[1]?.trim() || 'Medium') as MaintenanceEvaluation['rating'];

    const locMatch = sectionText.match(/Feature LOC: ~(\d+)/);
    const complexityMatch = sectionText.match(/Complexity: (Low|Medium|High)/);
    const depsMatch = sectionText.match(/Dependencies: (.+)/);

    let modificationEase: ModificationEaseClassification = 'few_files';
    if (sectionText.includes('[x] ✅ Change requires editing 1 file')) {
      modificationEase = 'single_file';
    } else if (sectionText.includes('[x] ❌ Change requires editing 4+ files')) {
      modificationEase = 'many_files';
    }

    let testability: TestabilityClassification = 'requires_mocking';
    if (sectionText.includes('[x] ✅ Feature can be unit tested in isolation')) {
      testability = 'isolated';
    } else if (sectionText.includes('[x] ❌ Tightly coupled')) {
      testability = 'tightly_coupled';
    }

    const assessmentMatch = sectionText.match(/#### \d+\.7[\s\S]*?\*\*Assessment:\*\*\n([\s\S]*?)(?=\n---|\n####|$)/);

    return {
      rating,
      modularity: {
        featureLOC: parseInt(locMatch?.[1] || '0', 10),
        complexity: (complexityMatch?.[1] || 'Medium') as 'Low' | 'Medium' | 'High',
        dependencies: depsMatch?.[1]?.split(',').map(d => d.trim()).filter(d => d && d !== 'None') || [],
      },
      modificationEase,
      testability,
      dependencies: [],
      assessment: assessmentMatch?.[1]?.trim() || '',
    };
  }

  /**
   * Parse stress collapse evaluation
   */
  static parseStressCollapse(sectionText: string, featureId: number): StressCollapseEvaluation {
    const dimMatch = sectionText.match(new RegExp(`#### ${featureId}\\.8 Stress Collapse Estimation: (.+)`));
    const collapseText = dimMatch?.[1]?.trim() || 'N/A';

    if (collapseText === 'N/A' || sectionText.includes('N/A -')) {
      const reasonMatch = sectionText.match(/N\/A - (.+)/);
      return {
        conditions: [],
        isRobust: true,
        robustReason: reasonMatch?.[1]?.trim() || 'Feature is robust',
      };
    }

    const conditions: StressCollapseCondition[] = [];
    const conditionMatches = sectionText.matchAll(/\*\*Condition (\d+):\*\* (.+)/g);
    for (const match of conditionMatches) {
      conditions.push({
        id: parseInt(match[1], 10),
        threshold: match[2].trim(),
        expectedBehavior: '',
        reasoning: [],
        codePatternReferences: [],
      });
    }

    return {
      conditions,
      isRobust: conditions.length === 0,
      robustReason: conditions.length === 0 ? 'No collapse conditions identified' : undefined,
    };
  }

  /**
   * Parse component summary
   */
  static parseComponentSummary(sectionText: string): ComponentSummary {
    const totalMatch = sectionText.match(/Total Atomic Features: (\d+)/);
    const enterpriseMatch = sectionText.match(/Enterprise-Level: (\d+)/);
    const fullMatch = sectionText.match(/Full Implementation: (\d+)/);
    const partialMatch = sectionText.match(/Partial Implementation: (\d+)/);
    const notImplMatch = sectionText.match(/Not Implemented: (\d+)/);

    const criticalIssues: string[] = [];
    const issuesMatch = sectionText.match(/\*\*Critical Issues Across Features:\*\*\n([\s\S]*?)(?=\n\*\*|$)/);
    if (issuesMatch) {
      const items = issuesMatch[1].split('\n').filter(l => l.match(/^\d+\./));
      for (const item of items) {
        criticalIssues.push(item.replace(/^\d+\.\s*/, '').trim());
      }
    }

    const strengths: string[] = [];
    const strengthsMatch = sectionText.match(/\*\*Strengths:\*\*\n([\s\S]*?)(?=\n\*\*|$)/);
    if (strengthsMatch) {
      const items = strengthsMatch[1].split('\n').filter(l => l.startsWith('-'));
      for (const item of items) {
        strengths.push(item.replace(/^-\s*/, '').trim());
      }
    }

    const recommendedActions: PriorityAction[] = [];
    const actionsMatch = sectionText.match(/\*\*Recommended Priority Actions:\*\*\n([\s\S]*?)(?=\n\*\*|$)/);
    if (actionsMatch) {
      const items = actionsMatch[1].split('\n').filter(l => l.match(/^\d+\./));
      for (const item of items) {
        const priorityMatch = item.match(/\*\*(High|Medium|Low) Priority:\*\* (.+)/);
        if (priorityMatch) {
          recommendedActions.push({
            priority: priorityMatch[1] as 'High' | 'Medium' | 'Low',
            action: priorityMatch[2].trim(),
          });
        }
      }
    }

    const readinessMatch = sectionText.match(/\*\*Overall Component Readiness:\*\* [✅🟡⚠️❌] (.+)/);
    let overallReadiness: ProductionReadinessStatus = 'Development';
    if (readinessMatch) {
      overallReadiness = readinessMatch[1].trim() as ProductionReadinessStatus;
    }

    return {
      statistics: {
        totalFeatures: parseInt(totalMatch?.[1] || '0', 10),
        enterpriseLevel: parseInt(enterpriseMatch?.[1] || '0', 10),
        fullImplementation: parseInt(fullMatch?.[1] || '0', 10),
        partialImplementation: parseInt(partialMatch?.[1] || '0', 10),
        notImplemented: parseInt(notImplMatch?.[1] || '0', 10),
      },
      criticalIssues,
      strengths,
      recommendedActions,
      overallReadiness,
    };
  }

  /**
   * Parse code evidence from a section
   */
  private static parseCodeEvidence(sectionText: string, dimensionId: string): CodeEvidence {
    const codeBlockMatch = sectionText.match(/```(\w+)\n\/\/ Lines (\d+)-(\d+) from (.+)\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      return {
        language: codeBlockMatch[1],
        lineNumbers: {
          start: parseInt(codeBlockMatch[2], 10),
          end: parseInt(codeBlockMatch[3], 10),
        },
        filePath: codeBlockMatch[4].trim(),
        codeSnippet: codeBlockMatch[5].trim(),
      };
    }
    return this.createDefaultEvidence();
  }

  /**
   * Create a default evidence object
   */
  private static createDefaultEvidence(): CodeEvidence {
    return {
      filePath: 'unknown',
      lineNumbers: { start: 1, end: 1 },
      codeSnippet: '',
      language: 'typescript',
    };
  }
}
