/**
 * Markdown Serializer for Evaluation Data
 * 
 * Serializes evaluation data structures to valid markdown format
 * for AGREEMENT.md and SUMMARY_AGREEMENT.md files.
 */

import type {
  AgreementDocument,
  AgreementHeader,
  FeatureIdentificationSection,
  ComponentSummary,
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
} from '../../types/dimensions';
import type { AtomicFeature, CodeEvidence, ExternalDependency } from '../../types/evaluation';

/**
 * Serializes evaluation data to markdown format
 */
export class MarkdownSerializer {
  /**
   * Serialize a complete AGREEMENT.md document
   */
  static serializeAgreement(document: AgreementDocument): string {
    const sections: string[] = [];

    // Header
    sections.push(this.serializeHeader(document.header));
    sections.push('---\n');

    // Feature Identification
    sections.push(this.serializeFeatureIdentification(document.featureIdentification));
    sections.push('---\n');

    // Feature Evaluations
    sections.push('## Feature-by-Feature Evaluation\n');
    for (const evaluation of document.featureEvaluations) {
      sections.push('---\n');
      sections.push(this.serializeFeatureEvaluation(evaluation));
    }

    // Component Summary
    sections.push('---\n');
    sections.push(this.serializeComponentSummary(document.componentSummary));

    return sections.join('\n');
  }

  /**
   * Serialize the header section
   */
  static serializeHeader(header: AgreementHeader): string {
    return `# ${header.componentName} - Evaluation Agreement

**Type:** ${header.type}
**Evaluated:** ${header.evaluatedDate}
**Path:** ${header.path}
**Lines of Code:** ${header.linesOfCode}
`;
  }

  /**
   * Serialize the feature identification section
   */
  static serializeFeatureIdentification(section: FeatureIdentificationSection): string {
    const lines: string[] = [];

    lines.push('## Atomic Feature Identification\n');
    lines.push('**Methodology:**');
    section.methodology.forEach((step, index) => {
      lines.push(`${index + 1}. ${step}`);
    });
    lines.push('');

    lines.push('**Identified Atomic Features:**\n');
    lines.push('| # | Feature Name | Description | LOC | Primary Location |');
    lines.push('|---|-------------|-------------|-----|------------------|');
    for (const feature of section.featuresTable) {
      const location = `${feature.primaryLocation.file}:${feature.primaryLocation.startLine}-${feature.primaryLocation.endLine}`;
      lines.push(`| ${feature.id} | ${feature.name} | ${feature.description} | ~${feature.linesOfCode} | ${location} |`);
    }
    lines.push('');

    lines.push(`**Total Atomic Features Identified:** ${section.totalFeatures}\n`);

    if (section.externalDependencies.length > 0) {
      lines.push('**External Dependencies (Separate Packages):**');
      for (const dep of section.externalDependencies) {
        lines.push(`- ${dep.packageName} - ${dep.purpose} (NOT evaluated as feature here)`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Serialize a single feature evaluation
   */
  static serializeFeatureEvaluation(evaluation: FeatureEvaluation): string {
    const { feature } = evaluation;
    const lines: string[] = [];

    lines.push(`### Feature ${feature.id}: ${feature.name}\n`);
    lines.push(`**Location:** \`${feature.primaryLocation.file}\`, lines ${feature.primaryLocation.startLine}-${feature.primaryLocation.endLine}`);
    lines.push(`**Code Volume:** ~${feature.linesOfCode} lines`);
    lines.push(`**Confidence Level:** High\n`);
    lines.push('---\n');

    // Dimension 1: Completeness
    lines.push(this.serializeCompleteness(evaluation.completeness, feature.id));
    lines.push('---\n');

    // Dimension 2: Code Quality
    lines.push(this.serializeCodeQuality(evaluation.codeQuality, feature.id));
    lines.push('---\n');

    // Dimension 3: Documentation
    lines.push(this.serializeDocumentation(evaluation.documentation, feature.id));
    lines.push('---\n');

    // Dimension 4: Reliability
    lines.push(this.serializeReliability(evaluation.reliability, feature.id));
    lines.push('---\n');

    // Dimension 5: Performance
    lines.push(this.serializePerformance(evaluation.performance, feature.id));
    lines.push('---\n');

    // Dimension 6: Integration
    lines.push(this.serializeIntegration(evaluation.integration, feature.id));
    lines.push('---\n');

    // Dimension 7: Maintenance
    lines.push(this.serializeMaintenance(evaluation.maintenance, feature.id));
    lines.push('---\n');

    // Dimension 8: Stress Collapse
    lines.push(this.serializeStressCollapse(evaluation.stressCollapse, feature.id));

    return lines.join('\n');
  }

  /**
   * Serialize completeness evaluation
   */
  static serializeCompleteness(eval_: CompletenessEvaluation, featureId: number): string {
    const lines: string[] = [];

    lines.push(`#### ${featureId}.1 Feature Completeness: ${eval_.rating} - ${eval_.percentage}%\n`);
    lines.push('**Implementation Status:**\n');

    if (eval_.implemented.length > 0) {
      lines.push('✅ **Implemented:**');
      for (const cap of eval_.implemented) {
        lines.push(`- ${cap.capability}`);
      }
      lines.push('');
    }

    if (eval_.missing.length > 0) {
      lines.push('❌ **Missing:**');
      for (const cap of eval_.missing) {
        lines.push(`- ${cap.capability}`);
      }
      lines.push('');
    }

    if (eval_.incomplete.length > 0) {
      lines.push('⚠️ **Incomplete:**');
      for (const cap of eval_.incomplete) {
        lines.push(`- ${cap.capability}${cap.details ? ` - ${cap.details}` : ''}`);
      }
      lines.push('');
    }

    lines.push('**Evidence:**');
    lines.push(this.serializeCodeEvidence(eval_.evidence));
    lines.push('');

    lines.push('**Rationale for Rating:**');
    lines.push(eval_.rationale);

    return lines.join('\n');
  }

  /**
   * Serialize code quality evaluation
   */
  static serializeCodeQuality(eval_: CodeQualityEvaluation, featureId: number): string {
    const lines: string[] = [];

    lines.push(`#### ${featureId}.2 Code Quality / Maintainability: ${eval_.rating}\n`);
    lines.push('**Code Organization:**');

    const isolationMap: Record<string, string> = {
      'isolated_module': '- [x] ✅ Feature isolated in separate module/hook',
      'same_file_separated': '- [x] ⚠️ Feature in same file, clearly separated',
      'mixed_with_other': '- [x] ❌ Feature mixed with other logic',
      'scattered_files': '- [x] ❌ Feature scattered across multiple files',
    };

    const allOptions = [
      { key: 'isolated_module', text: '- [ ] ✅ Feature isolated in separate module/hook' },
      { key: 'same_file_separated', text: '- [ ] ⚠️ Feature in same file, clearly separated' },
      { key: 'mixed_with_other', text: '- [ ] ❌ Feature mixed with other logic' },
      { key: 'scattered_files', text: '- [ ] ❌ Feature scattered across multiple files' },
    ];

    for (const opt of allOptions) {
      if (opt.key === eval_.featureIsolation) {
        lines.push(isolationMap[opt.key]);
      } else {
        lines.push(opt.text);
      }
    }
    lines.push('');

    if (eval_.antiPatterns.length > 0) {
      lines.push('**Anti-Patterns Detected:**\n');
      for (const ap of eval_.antiPatterns) {
        lines.push(`**#${ap.id}: ${ap.name}**`);
        lines.push(this.serializeCodeEvidence(ap.evidence));
        lines.push(`- **Issue:** ${ap.issue}`);
        lines.push(`- **Impact:** ${ap.impact}`);
        lines.push('- **Better Approach:**');
        lines.push(`  ${ap.betterApproach.description}`);
        lines.push('```typescript');
        lines.push(ap.betterApproach.codeExample);
        lines.push('```\n');
      }
    }

    if (eval_.goodPractices.length > 0) {
      lines.push('**Good Practices Observed:**');
      for (const gp of eval_.goodPractices) {
        lines.push(`- ✅ ${gp.name}: ${gp.description}`);
      }
      lines.push('');
    }

    lines.push('**Overall Code Quality Assessment:**');
    lines.push(eval_.assessment);

    return lines.join('\n');
  }

  /**
   * Serialize documentation evaluation
   */
  static serializeDocumentation(eval_: DocumentationEvaluation, featureId: number): string {
    const lines: string[] = [];

    lines.push(`#### ${featureId}.3 Documentation & Comments: ${eval_.rating}\n`);
    lines.push('**Documentation Coverage:**');
    lines.push(`- [${eval_.coverage.hasJSDoc ? 'x' : ' '}] JSDoc/TSDoc comments on feature functions`);
    lines.push(`- [${eval_.coverage.hasInlineComments ? 'x' : ' '}] Inline comments explaining complex logic`);
    lines.push(`- [${eval_.coverage.hasSelfDocumentingNames ? 'x' : ' '}] Self-documenting variable/function names`);
    lines.push(`- [${eval_.coverage.hasUsageExamples ? 'x' : ' '}] Usage examples`);
    lines.push(`- [${eval_.coverage.hasEdgeCaseDocs ? 'x' : ' '}] Edge cases documented`);
    lines.push('');

    if (eval_.examples.goodDocumentation.length > 0 || eval_.examples.missingDocumentation.length > 0) {
      lines.push('**Examples:**');
      for (const good of eval_.examples.goodDocumentation) {
        lines.push('```typescript');
        lines.push(`// FOUND: Good documentation`);
        lines.push(`// Lines ${good.lineNumbers.start}-${good.lineNumbers.end} from ${good.filePath}`);
        lines.push(good.codeSnippet);
        lines.push('```');
      }
      for (const missing of eval_.examples.missingDocumentation) {
        lines.push('```typescript');
        lines.push(`// MISSING: No explanation`);
        lines.push(`// Lines ${missing.lineNumbers.start}-${missing.lineNumbers.end} from ${missing.filePath}`);
        lines.push(missing.codeSnippet);
        lines.push('```');
      }
      lines.push('');
    }

    lines.push('**Assessment:**');
    lines.push(eval_.assessment);

    return lines.join('\n');
  }

  /**
   * Serialize reliability evaluation
   */
  static serializeReliability(eval_: ReliabilityEvaluation, featureId: number): string {
    const lines: string[] = [];

    lines.push(`#### ${featureId}.4 Reliability / Fault-Tolerance: ${eval_.rating}\n`);
    lines.push('**Error Handling Analysis:**\n');

    if (eval_.presentErrorHandling.length > 0) {
      lines.push('✅ **Present:**');
      for (const eh of eval_.presentErrorHandling) {
        lines.push(`- ${eh.description}`);
      }
      lines.push('');
    }

    if (eval_.missingErrorHandling.length > 0) {
      lines.push('❌ **Missing:**');
      for (const gap of eval_.missingErrorHandling) {
        lines.push(`- ${gap.scenario} (${gap.location.file}:${gap.location.line}) - Risk: ${gap.risk}`);
      }
      lines.push('');
    }

    lines.push('**Edge Cases:**');
    lines.push(eval_.edgeCaseHandling.description);
    lines.push('');

    lines.push('**Assessment:**');
    lines.push(eval_.assessment);

    return lines.join('\n');
  }

  /**
   * Serialize performance evaluation
   */
  static serializePerformance(eval_: PerformanceEvaluation, featureId: number): string {
    const lines: string[] = [];

    lines.push(`#### ${featureId}.5 Performance & Efficiency: ${eval_.rating}\n`);
    lines.push('**Performance Analysis:**\n');

    if (eval_.concerns.length > 0) {
      lines.push('**Concerns Identified:**\n');
      for (const concern of eval_.concerns) {
        lines.push(`**#${concern.id}: ${concern.issue}**`);
        lines.push(this.serializeCodeEvidence(concern.evidence));
        lines.push(`- **Impact:** ${concern.impact}`);
        lines.push(`- **Fix:** ${concern.recommendedFix}`);
        lines.push('');
      }
    }

    if (eval_.optimizations.length > 0) {
      lines.push('**Optimizations Found:**');
      for (const opt of eval_.optimizations) {
        lines.push(`- ✅ ${opt.technique}: ${opt.description}`);
      }
      lines.push('');
    }

    lines.push('**Complexity Analysis:**');
    lines.push(`- Algorithmic Complexity: ${eval_.complexityAnalysis.algorithmicComplexity}`);
    lines.push(`- Loop Analysis: ${eval_.complexityAnalysis.loopAnalysis}`);
    lines.push('');

    lines.push('**Assessment:**');
    lines.push(eval_.assessment);

    return lines.join('\n');
  }

  /**
   * Serialize integration evaluation
   */
  static serializeIntegration(eval_: IntegrationEvaluation, featureId: number): string {
    const lines: string[] = [];

    lines.push(`#### ${featureId}.6 Integration & Extensibility: ${eval_.rating}\n`);
    lines.push('**Integration Analysis:**\n');

    if (eval_.configurationOptions.length > 0) {
      lines.push('**Configuration Options:**');
      lines.push('```typescript');
      lines.push('{');
      for (const opt of eval_.configurationOptions) {
        const marker = opt.present ? '✅' : '❌';
        lines.push(`  ${opt.name}: ${opt.type};  // ${marker} ${opt.present ? 'Present' : 'Missing'}`);
      }
      lines.push('}');
      lines.push('```\n');
    }

    lines.push('**Extensibility:**');
    lines.push(`- [${eval_.extensibility.hasHooksCallbacks ? 'x' : ' '}] ✅ Hooks/callbacks for custom behavior`);
    lines.push(`- [${eval_.extensibility.hasSomeExtensionPoints ? 'x' : ' '}] ⚠️ Some extension points`);
    lines.push(`- [${eval_.extensibility.isHardcoded ? 'x' : ' '}] ❌ Hardcoded, not extensible`);
    lines.push('');

    lines.push(`**Toggle Capability:** ${eval_.toggleCapability ? 'Yes' : 'No'}`);
    lines.push('');

    lines.push('**Works with other features:**');
    lines.push(eval_.featureInteractions);
    lines.push('');

    lines.push('**Assessment:**');
    lines.push(eval_.assessment);

    return lines.join('\n');
  }

  /**
   * Serialize maintenance evaluation
   */
  static serializeMaintenance(eval_: MaintenanceEvaluation, featureId: number): string {
    const lines: string[] = [];

    lines.push(`#### ${featureId}.7 Maintenance & Support: ${eval_.rating}\n`);
    lines.push('**Maintainability Analysis:**\n');

    lines.push('**Modularity:**');
    lines.push(`- Feature LOC: ~${eval_.modularity.featureLOC} lines`);
    lines.push(`- Complexity: ${eval_.modularity.complexity}`);
    lines.push(`- Dependencies: ${eval_.modularity.dependencies.join(', ') || 'None'}`);
    lines.push('');

    lines.push('**Ease of Modification:**');
    const modMap: Record<string, string> = {
      'single_file': '- [x] ✅ Change requires editing 1 file',
      'few_files': '- [x] ⚠️ Change requires editing 2-3 files',
      'many_files': '- [x] ❌ Change requires editing 4+ files',
    };
    const modOptions = [
      { key: 'single_file', text: '- [ ] ✅ Change requires editing 1 file' },
      { key: 'few_files', text: '- [ ] ⚠️ Change requires editing 2-3 files' },
      { key: 'many_files', text: '- [ ] ❌ Change requires editing 4+ files' },
    ];
    for (const opt of modOptions) {
      if (opt.key === eval_.modificationEase) {
        lines.push(modMap[opt.key]);
      } else {
        lines.push(opt.text);
      }
    }
    lines.push('');

    lines.push('**Testability:**');
    const testMap: Record<string, string> = {
      'isolated': '- [x] ✅ Feature can be unit tested in isolation',
      'requires_mocking': '- [x] ⚠️ Requires significant mocking',
      'tightly_coupled': '- [x] ❌ Tightly coupled, hard to test',
    };
    const testOptions = [
      { key: 'isolated', text: '- [ ] ✅ Feature can be unit tested in isolation' },
      { key: 'requires_mocking', text: '- [ ] ⚠️ Requires significant mocking' },
      { key: 'tightly_coupled', text: '- [ ] ❌ Tightly coupled, hard to test' },
    ];
    for (const opt of testOptions) {
      if (opt.key === eval_.testability) {
        lines.push(testMap[opt.key]);
      } else {
        lines.push(opt.text);
      }
    }
    lines.push('');

    lines.push('**Assessment:**');
    lines.push(eval_.assessment);

    return lines.join('\n');
  }

  /**
   * Serialize stress collapse evaluation
   */
  static serializeStressCollapse(eval_: StressCollapseEvaluation, featureId: number): string {
    const lines: string[] = [];

    const collapseText = eval_.isRobust ? 'N/A' : eval_.conditions[0]?.threshold || 'Unknown';
    lines.push(`#### ${featureId}.8 Stress Collapse Estimation: ${collapseText}\n`);
    lines.push('**Failure Condition Analysis:**\n');

    if (eval_.isRobust) {
      lines.push(`N/A - ${eval_.robustReason || 'Feature is robust with no identified collapse scenario'}`);
    } else {
      for (const condition of eval_.conditions) {
        lines.push(`**Condition ${condition.id}:** ${condition.threshold}`);
        lines.push('```');
        lines.push(`${condition.threshold} → ${condition.expectedBehavior}`);
        lines.push('```');
        lines.push('**Reasoning:**');
        for (const reason of condition.reasoning) {
          lines.push(`- ${reason}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Serialize component summary
   */
  static serializeComponentSummary(summary: ComponentSummary): string {
    const lines: string[] = [];

    lines.push('## Component-Level Summary\n');
    lines.push('**Overall Statistics:**');
    lines.push(`- Total Atomic Features: ${summary.statistics.totalFeatures}`);
    lines.push(`- Enterprise-Level: ${summary.statistics.enterpriseLevel}`);
    lines.push(`- Full Implementation: ${summary.statistics.fullImplementation}`);
    lines.push(`- Partial Implementation: ${summary.statistics.partialImplementation}`);
    lines.push(`- Not Implemented: ${summary.statistics.notImplemented}`);
    lines.push('');

    if (summary.criticalIssues.length > 0) {
      lines.push('**Critical Issues Across Features:**');
      summary.criticalIssues.forEach((issue, index) => {
        lines.push(`${index + 1}. ${issue}`);
      });
      lines.push('');
    }

    if (summary.strengths.length > 0) {
      lines.push('**Strengths:**');
      for (const strength of summary.strengths) {
        lines.push(`- ${strength}`);
      }
      lines.push('');
    }

    if (summary.recommendedActions.length > 0) {
      lines.push('**Recommended Priority Actions:**');
      summary.recommendedActions.forEach((action, index) => {
        lines.push(`${index + 1}. **${action.priority} Priority:** ${action.action}${action.feature ? ` (${action.feature})` : ''}`);
      });
      lines.push('');
    }

    const statusEmoji: Record<string, string> = {
      'Production Ready': '✅',
      'Staging Ready': '🟡',
      'Development': '⚠️',
      'Not Ready': '❌',
    };
    lines.push(`**Overall Component Readiness:** ${statusEmoji[summary.overallReadiness]} ${summary.overallReadiness}`);

    return lines.join('\n');
  }

  /**
   * Serialize code evidence to markdown code block
   */
  static serializeCodeEvidence(evidence: CodeEvidence): string {
    return `\`\`\`${evidence.language}
// Lines ${evidence.lineNumbers.start}-${evidence.lineNumbers.end} from ${evidence.filePath}
${evidence.codeSnippet}
\`\`\``;
  }
}
