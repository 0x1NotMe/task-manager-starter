import { contractAbis } from "./abirefs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

// Define interfaces for ABI types to fix type errors
interface AbiInput {
  name: string;
  type: string;
  internalType?: string;
  indexed?: boolean;
  components?: Array<{
    name: string;
    type: string;
    internalType?: string;
  }>;
}

interface AbiOutput {
  name: string;
  type: string;
  internalType?: string;
  components?: Array<{
    name: string;
    type: string;
    internalType?: string;
  }>;
}

interface AbiFunctionItem {
  type: string;
  name: string;
  inputs?: AbiInput[];
  outputs?: AbiOutput[];
  stateMutability: string;
}

// Adding a more generic ABI item type
interface AbiItem {
  type: string;
  name?: string;
  inputs?: AbiInput[];
  outputs?: AbiOutput[];
  stateMutability?: string;
  anonymous?: boolean;
}

// Code Block Component with Syntax Highlighting
function CodeBlock({ code, language }: { code: string, language: string }) {
  return (
    <div className="rounded-md overflow-hidden">
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, borderRadius: '0.375rem' }}
        showLineNumbers
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// Get Started Tab Component
function GetStartedTab() {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Quick Start Guide</h2>
      <p className="mb-4">
        Get started quickly with the Task Manager by following these steps.
        For more detailed examples, check out the <a href="https://github.com/FastLane-Labs/task-manager-script" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Example Repository</a>.
      </p>
      
      <div className="space-y-6">
        {/* Step 1 */}
        <div className="bg-muted/30 p-6 rounded-lg border">
          <h3 className="text-xl font-medium mb-3">1. Connect to Contracts via AddressHub</h3>
          <div className="space-y-3 text-sm">
            <p>
              The AddressHub contract provides addresses for all required system contracts:
            </p>
            <CodeBlock 
              language="typescript" 
              code={`// Import helpers and configure client
import { AddressHubHelper } from './utils/address-hub';
import { publicClient } from './config';

// Connect to AddressHub (testnet: 0xC9f0cDE8316AbC5Efc8C3f5A6b571e815C021B51)
const addressHub = new AddressHubHelper(ADDRESS_HUB, publicClient);

// Get contract addresses
const taskManagerAddress = await addressHub.getTaskManagerAddress();
const shmonadAddress = await addressHub.getShmonadAddress();`}
            />
            <p className="text-muted-foreground mt-2">
              <a 
                href="https://docs.shmonad.xyz/products/task-manager/overview" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Learn more about AddressHub in the full documentation →
              </a>
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-muted/30 p-6 rounded-lg border">
          <h3 className="text-xl font-medium mb-3">2. Prepare Task Data</h3>
          <div className="space-y-3 text-sm">
            <p>
              Tasks require proper encoding in three steps:
            </p>
            <CodeBlock 
              language="typescript" 
              code={`// 1. Encode the target function call
const targetCall = encodeFunctionData({
  abi: yourContractAbi,
  functionName: 'yourFunction',
  args: [/* your args */]
});

// 2. Pack with target address
const packedData = encodePacked(
  ['address', 'bytes'],
  [targetAddress, targetCall]
);

// 3. Encode for execution environment
const taskData = encodeFunctionData({
  abi: executionEnvAbi,
  functionName: 'executeTask',
  args: [packedData]
});`}
            />
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-muted/30 p-6 rounded-lg border">
          <h3 className="text-xl font-medium mb-3">3. Bond Tokens</h3>
          <div className="space-y-3 text-sm">
            <p>
              Before scheduling tasks, ensure sufficient bonds:
            </p>
            <CodeBlock 
              language="typescript" 
              code={`// Estimate cost and required bond
const estimatedCost = await taskManager.estimateCost(targetBlock, gasLimit);
const requiredBond = estimatedCost * BigInt(2); // 2x safety margin

// Check if current bond is sufficient
if (!await shmonad.hasSufficientBond(policyId, address, requiredBond)) {
  // Bond more tokens if needed
  await shmonad.depositAndBond({
    policyId,
    amount: requiredBond
  });
}`}
            />
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-muted/30 p-6 rounded-lg border">
          <h3 className="text-xl font-medium mb-3">4. Schedule a Task</h3>
          <div className="space-y-3 text-sm">
            <p>
              Schedule the task with the Task Manager:
            </p>
            <CodeBlock 
              language="typescript" 
              code={`// Define task parameters
const task = {
  implementation: executionEnvAddress,
  gas: BigInt(100_000),        // Gas limit
  targetBlock: currentBlock + BigInt(10),
  maxPayment: estimatedCost,
  data: taskData
};

// Schedule the task
const { scheduled, executionCost, taskId } = await taskManager.scheduleTask(task);

// Track task status
console.log(\`Task scheduled with ID: \${taskId}\`);
const isExecuted = await taskManager.isTaskExecuted(taskId);`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// Execution Environments Tab Component
function ExecutionEnvironmentsTab() {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Execution Environments</h2>
      <p className="mb-4">
        Execution Environments (EEs) are a critical security component of the Task Manager system that provide isolated contexts for task execution.
        While basic environments are provided out of the box, teams are encouraged to develop custom environments for their specific needs.
        Check out the <a href="https://github.com/FastLane-Labs/task-manager-script" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Example Repository</a> for implementation examples.
      </p>
      
      <div className="space-y-6">
        {/* What are Execution Environments */}
        <div className="bg-muted/30 p-6 rounded-lg border">
          <h3 className="text-xl font-medium mb-3">What are Execution Environments?</h3>
          <div className="space-y-3 text-sm">
            <p>
              Execution Environments (EEs) serve as airgapped security boundaries for tasks, ensuring:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Isolated execution of each task</li>
              <li>Controlled access to task execution</li>
              <li>Customizable execution logic</li>
              <li>Protection against unauthorized calls</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              The Task Manager uses a specialized proxy pattern to interact with EEs, ensuring that only authorized operations can be performed.
            </p>
          </div>
        </div>
        
        {/* Available Environments */}
        <div className="bg-muted/30 p-6 rounded-lg border">
          <h3 className="text-xl font-medium mb-3">Available Environments</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-base mb-2">BasicTaskEnvironment</h4>
              <p className="mb-2">
                A simple environment that provides pre-execution validation and execution logging.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Input validation (non-zero address, non-empty calldata)</li>
                <li>Detailed event emission</li>
                <li>Error propagation from failed calls</li>
                <li>Task isolation</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-base mb-2">ReschedulingTaskEnvironment</h4>
              <p className="mb-2">
                An environment that implements automatic retry logic for failed tasks.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Maximum of 3 retry attempts</li>
                <li>5 block delay between retries</li>
                <li>Event emission for execution tracking</li>
                <li>Built-in input validation</li>
              </ul>
              <div className="mt-3">
                <p className="font-medium">Usage example:</p>
                <CodeBlock 
                  language="solidity" 
                  code={`// Deploy the environment
ReschedulingTaskEnvironment env = new ReschedulingTaskEnvironment(taskManagerAddress);

// Schedule a task using this environment
taskManager.scheduleTask(
    address(env),    // Use the rescheduling environment
    100_000,        // Gas limit
    targetBlock,    // Target block
    maxPayment,     // Max payment
    taskData        // Encoded task data
);`}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Security Model */}
        <div className="bg-muted/30 p-6 rounded-lg border">
          <h3 className="text-xl font-medium mb-3">Security Model</h3>
          <div className="space-y-3 text-sm">
            <p>
              The security of Execution Environments is enforced at two levels:
            </p>
            
            <div>
              <h4 className="font-semibold text-base mb-1">1. Proxy-Level Enforcement (Primary Security)</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>The Task Manager uses a specialized proxy pattern to interact with EEs</li>
                <li>Only the <code>executeTask</code> function can be called through this proxy</li>
                <li>All other function calls are blocked at the proxy level</li>
                <li>This makes the <code>onlyTaskManager</code> modifier optional, as security is enforced by the proxy</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-base mb-1">2. Environment-Level Controls (Additional Safety)</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>EEs can implement additional security measures</li>
                <li>Input validation</li>
                <li>Custom access controls</li>
                <li>Execution flow restrictions</li>
              </ul>
            </div>
            
            <div className="mt-3">
              <p className="font-medium">Key security features:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Airgapped Execution: Tasks execute in isolated environments</li>
                <li>Proxy Protection: Only authorized functions can be called</li>
                <li>Customizable Security: Each EE can add its own security measures</li>
                <li>No State Dependencies: EEs should be stateless between executions</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Creating Custom Environments */}
        <div className="bg-muted/30 p-6 rounded-lg border">
          <h3 className="text-xl font-medium mb-3">Creating Custom Environments</h3>
          <div className="space-y-4 text-sm">
            <p>
              To create your own execution environment:
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Inherit from <code>TaskExecutionBase</code> (optional)</li>
              <li>Implement the <code>executeTask</code> function</li>
              <li>Add custom logic for pre/post execution hooks, error handling, event emission, etc.</li>
            </ol>
            
            <div className="mt-3">
              <p className="font-medium">Template:</p>
              <CodeBlock 
                language="solidity" 
                code={`contract CustomTaskEnvironment is TaskExecutionBase {
    constructor(address taskManager_) TaskExecutionBase(taskManager_) {}

    function executeTask(bytes calldata taskData) 
        external 
        onlyTaskManager 
        returns (bool)
    {
        // 1. Decode task data
        (address target, bytes memory data) = abi.decode(taskData, (address, bytes));

        // 2. Add custom pre-execution logic
        
        // 3. Execute the task
        (bool success,) = target.call(data);
        
        // 4. Add custom post-execution logic
        
        return success;
    }
}`}
              />
            </div>
            
            <div className="mt-4">
              <p className="font-medium">Example with validation:</p>
              <CodeBlock 
                language="solidity" 
                code={`contract ValidatedExecutionEnvironment is TaskExecutionBase {
    // Custom error types
    error InvalidTarget();
    error InvalidValue();
    
    // Events for tracking
    event TaskValidated(address target, uint256 value);
    
    constructor(address taskManager_) TaskExecutionBase(taskManager_) {}
    
    function executeTask(bytes calldata taskData) 
        external 
        onlyTaskManager 
        returns (bool)
    {
        // Decode with custom parameters
        (address target, bytes memory data) = abi.decode(taskData, (address, bytes));
        
        // Custom validation
        if (!isValidTarget(target)) revert InvalidTarget();
        if (!isValidValue(data)) revert InvalidValue();
        
        // Emit pre-execution event
        emit TaskValidated(target, abi.decode(data, (uint256)));
        
        // Execute with validated parameters
        (bool success,) = target.call(data);
        return success;
    }
    
    function isValidTarget(address target) internal view returns (bool) {
        // Add custom target validation
        return target != address(0) && target.code.length > 0;
    }
    
    function isValidValue(bytes memory data) internal pure returns (bool) {
        // Add custom data validation
        if (data.length < 4) return false; // At least need function selector
        return true;
    }
}`}
              />
            </div>
          </div>
        </div>
        
        {/* Best Practices */}
        <div className="bg-muted/30 p-6 rounded-lg border">
          <h3 className="text-xl font-medium mb-3">Best Practices</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-base mb-1">1. Post-Execution Control</h4>
              <p className="mb-2">
                Instead of modifying the EE, implement control flow in your target contract:
              </p>
              <CodeBlock 
                language="solidity" 
                code={`contract MyTarget {
    function executeWithPostChecks(uint256 value) external {
        // Perform the main task
        performTask(value);
        
        // Add post-execution logic here
        if (condition) {
            handleSuccess();
        } else {
            handleFailure();
        }
    }
}`}
              />
            </div>
            
            <div>
              <h4 className="font-semibold text-base mb-1">2. Environment Selection</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Use <code>BasicTaskEnvironment</code> for simple, direct execution</li>
                <li>Use <code>ReschedulingTaskEnvironment</code> for automatic retry logic</li>
                <li>Create custom environments for specific requirements</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-base mb-1">3. Security Considerations</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>EEs should not store state between executions</li>
                <li>Validate all inputs in <code>executeTask</code></li>
                <li>Emit events for important state changes</li>
                <li>Consider gas implications of custom logic</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Contract ABIs Tab Component
function ContractAbisTab() {
  // Debug the contractAbis data structure
  console.log("Contract ABIs:", contractAbis);
  
  // Helper function to create a unique key for a function
  const createFunctionKey = (fn: AbiFunctionItem, index: number): string => {
    // For overloaded functions, we create a unique key by including the parameter types
    const paramTypes = fn.inputs?.map(input => input.type).join(',') || '';
    return `${fn.name}-${paramTypes}-${index}`;
  };
  
  return (
    <Accordion type="multiple" className="w-full space-y-4">
      {contractAbis.map(({ name: contractName, abi: abiData }) => {
        console.log(`Processing contract ${contractName}:`, abiData);
        
        // Ensure the ABI is an array
        const abiArray = Array.isArray(abiData) ? abiData as AbiItem[] : [];
        
        // Skip if we couldn't find a valid ABI array
        if (abiArray.length === 0) {
          console.log(`No valid ABI found for ${contractName}`);
          return (
            <AccordionItem key={contractName} value={contractName} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 bg-muted/50 hover:bg-muted/70">
                <span className="text-lg font-medium">{contractName}</span>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="px-4 py-3">
                  <p className="text-muted-foreground italic">No ABI information available.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        }

        // Get functions from ABI
        const functions = abiArray.filter(
          (item) => item.type === "function"
        ) as AbiFunctionItem[];

        // Group functions by state mutability
        const viewFunctions = functions.filter(
          (fn) => fn.stateMutability === "view" || fn.stateMutability === "pure"
        );
        const writeFunctions = functions.filter(
          (fn) =>
            fn.stateMutability === "nonpayable" ||
            fn.stateMutability === "payable"
        );
        const events = abiArray.filter(
          (item) => item.type === "event"
        );

        return (
          <AccordionItem key={contractName} value={contractName} className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-3 bg-muted/50 hover:bg-muted/70">
              <span className="text-lg font-medium">{contractName}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                ({functions.length} functions, {events.length} events)
              </span>
            </AccordionTrigger>
            <AccordionContent className="p-0">
              <div className="px-4 py-3 space-y-4">
                {viewFunctions.length === 0 && writeFunctions.length === 0 && events.length === 0 ? (
                  <p className="text-muted-foreground italic py-2">This contract has no documented functions or events.</p>
                ) : (
                  <>
                    {/* View Functions */}
                    {viewFunctions.length > 0 && (
                      <div>
                        <h3 className="text-md font-semibold mb-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-md inline-block">
                          View Functions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {viewFunctions.map((fn, index) => (
                            <div
                              key={createFunctionKey(fn, index)}
                              className="p-3 border rounded-md bg-muted/30"
                            >
                              <h4 className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400">
                                {fn.name}
                                {fn.inputs && fn.inputs.length > 0 && (
                                  <span className="text-xs opacity-70">
                                    ({fn.inputs.map(i => i.type).join(', ')})
                                  </span>
                                )}
                              </h4>
                              <div className="mt-2 space-y-2">
                                {fn.inputs && fn.inputs.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium">Inputs:</p>
                                    <ul className="text-xs pl-4 space-y-1">
                                      {fn.inputs.map((input: AbiInput, i: number) => (
                                        <li key={i}>
                                          <span className="font-mono">
                                            {input.name}: {input.type}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {fn.outputs && fn.outputs.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium">
                                      Returns:
                                    </p>
                                    <ul className="text-xs pl-4 space-y-1">
                                      {fn.outputs.map((output: AbiOutput, i: number) => (
                                        <li key={i}>
                                          <span className="font-mono">
                                            {output.name
                                              ? `${output.name}: `
                                              : ""}
                                            {output.type}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Write Functions */}
                    {writeFunctions.length > 0 && (
                      <div>
                        <h3 className="text-md font-semibold mb-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 rounded-md inline-block">
                          Write Functions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {writeFunctions.map((fn, index) => (
                            <div
                              key={createFunctionKey(fn, index)}
                              className={cn(
                                "p-3 border rounded-md bg-muted/30",
                                fn.stateMutability === "payable"
                                  ? "border-orange-200 dark:border-orange-800"
                                  : ""
                              )}
                            >
                              <div className="flex justify-between items-start">
                                <h4 className="font-mono text-sm font-medium text-orange-600 dark:text-orange-400">
                                  {fn.name}
                                  {fn.inputs && fn.inputs.length > 0 && (
                                    <span className="text-xs opacity-70 ml-1">
                                      ({fn.inputs.map(i => i.type).join(', ')})
                                    </span>
                                  )}
                                </h4>
                                {fn.stateMutability === "payable" && (
                                  <span className="text-xs bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded text-orange-700 dark:text-orange-300">
                                    payable
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 space-y-2">
                                {fn.inputs && fn.inputs.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium">Inputs:</p>
                                    <ul className="text-xs pl-4 space-y-1">
                                      {fn.inputs.map((input: AbiInput, i: number) => (
                                        <li key={i}>
                                          <span className="font-mono">
                                            {input.name}: {input.type}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {fn.outputs && fn.outputs.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium">
                                      Returns:
                                    </p>
                                    <ul className="text-xs pl-4 space-y-1">
                                      {fn.outputs.map((output: AbiOutput, i: number) => (
                                        <li key={i}>
                                          <span className="font-mono">
                                            {output.name
                                              ? `${output.name}: `
                                              : ""}
                                            {output.type}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Events */}
                    {events.length > 0 && (
                      <div>
                        <h3 className="text-md font-semibold mb-2 px-2 py-1 bg-purple-100 dark:bg-purple-900/20 rounded-md inline-block">
                          Events
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {events.map((event: AbiItem, idx: number) => {
                            // Create a unique key for events as well
                            const paramTypes = event.inputs?.map(input => input.type).join(',') || '';
                            const eventKey = `${event.name}-${paramTypes}-${idx}`;
                            
                            return (
                            <div
                              key={eventKey}
                              className="p-3 border rounded-md bg-muted/30"
                            >
                              <div className="flex justify-between items-start">
                                <h4 className="font-mono text-sm font-medium text-purple-600 dark:text-purple-400">
                                  {event.name}
                                  {event.inputs && event.inputs.length > 0 && (
                                    <span className="text-xs opacity-70 ml-1">
                                      ({event.inputs.map(i => i.type).join(', ')})
                                    </span>
                                  )}
                                </h4>
                                {event.anonymous && (
                                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded text-purple-700 dark:text-purple-300">
                                    anonymous
                                  </span>
                                )}
                              </div>
                              {event.inputs && event.inputs.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium">
                                    Parameters:
                                  </p>
                                  <ul className="text-xs pl-4 space-y-1">
                                    {event.inputs.map((input: AbiInput, i: number) => (
                                      <li key={i}>
                                        <span className="font-mono">
                                          {input.indexed && (
                                            <span className="text-purple-500 dark:text-purple-400 mr-1">
                                              [indexed]
                                            </span>
                                          )}
                                          {input.name}: {input.type}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

// The main page component that uses the tab components
export default function DocsPage() {
  return (
    <>
      <Header />
      <div className="container mx-auto py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Task Manager Documentation</h1>
          <p className="text-muted-foreground mb-6">
            Resources to help you integrate with the Task Manager DApp.
          </p>

          <Tabs defaultValue="get-started" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="get-started" className="px-4 py-2 flex-1">Get Started</TabsTrigger>
              <TabsTrigger value="execution-env" className="px-4 py-2 flex-1">Execution</TabsTrigger>
              <TabsTrigger value="abi" className="px-4 py-2 flex-1">Contract ABIs</TabsTrigger>
            </TabsList>

            <TabsContent value="get-started" className="space-y-6">
              <GetStartedTab />
            </TabsContent>
            
            <TabsContent value="execution-env" className="space-y-6">
              <ExecutionEnvironmentsTab />
            </TabsContent>

            <TabsContent value="abi">
              <ContractAbisTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
} 