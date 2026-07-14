export interface CodeTemplate {
  name: string;
  language: string;
  description: string;
  code: string;
}

export const INSTRUMENTATION_TEMPLATES: CodeTemplate[] = [
  {
    name: "Express.js (OpenTelemetry SDK)",
    language: "typescript",
    description: "Standard OpenTelemetry instrumentation helper file for an Express application, exporting telemetry to a local or cloud SigNoz instance.",
    code: `// instrumentation.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-node';

// Configure SigNoz OTLP endpoint (default local port is 4317 for gRPC)
const signozEndpoint = process.env.SIGNOZ_ENDPOINT || "http://localhost:4317";

const sdk = new NodeSDK({
  // Only track 10% of requests in production to minimize overhead (Trace Sampling)
  sampler: new TraceIdRatioBasedSampler(0.1),
  serviceName: 'my-express-service',
  traceExporter: new OTLPTraceExporter({
    url: \`\${signozEndpoint}/v1/traces\`
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: \`\${signozEndpoint}/v1/metrics\`
    })
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable noisy HTTP routes to keep dashboards clean
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingRequestHook: (req) => {
          return req.url?.startsWith('/health') || false;
        }
      }
    })
  ]
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
`
  },
  {
    name: "Python Flask (OpenTelemetry Distro)",
    language: "python",
    description: "Instrument your Flask app using standard OpenTelemetry CLI wrapper, directing output to SigNoz.",
    code: `# 1. Install dependencies
# pip install opentelemetry-distro opentelemetry-exporter-otlp
# opentelemetry-bootstrap -a install

# 2. Run your Flask app with the following environment variables:
# export OTEL_RESOURCE_ATTRIBUTES=service.name=my-flask-service
# export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"
# export OTEL_EXPORTER_OTLP_PROTOCOL="grpc"
# opentelemetry-instrument python app.py

from flask import Flask, jsonify
import random
import time

app = Flask(__name__)

@app.route("/api/checkout", methods=["POST"])
def checkout():
    # Simulate DB dependency delay
    delay = random.uniform(0.1, 0.8)
    time.sleep(delay)
    
    if delay > 0.6:
        # Simulate occasional error to trace in SigNoz
        return jsonify({"status": "error", "message": "DB lock timeout"}), 500
        
    return jsonify({"status": "success", "processed_in": f"{delay:.2f}s"})

if __name__ == "__main__":
    app.run(port=5000)
`
  },
  {
    name: "Go HTTP Server (Manual Tracer)",
    language: "go",
    description: "Instrument a Go API gateway manually using the native OpenTelemetry Go SDK and routing data to SigNoz.",
    code: `package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
)

func initTracer() (*sdktrace.TracerProvider, error) {
	ctx := context.Background()

	// Connect to SigNoz OTLP endpoint (default: localhost:4317)
	exporter, err := otlptracegrpc.New(ctx,
		otlptracegrpc.WithInsecure(),
		otlptracegrpc.WithEndpoint("localhost:4317"),
	)
	if err != nil {
		return nil, err
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceNameKey.String("go-payment-gateway"),
		)),
	)
	otel.SetTracerProvider(tp)
	return tp, nil
}

func main() {
	tp, err := initTracer()
	if err != nil {
		log.Fatalf("failed to init tracer: %v", err)
	}
	defer tp.Shutdown(context.Background())

	tracer := otel.Tracer("gateway-handler")

	http.HandleFunc("/charge", func(w http.ResponseWriter, r *r.Request) {
		ctx, span := tracer.Start(r.Context(), "ProcessPayment")
		defer span.End()

		time.Sleep(120 * time.Millisecond) // Simulate card processing
		w.Write([]byte("payment processed successfully"))
	})

	log.Println("Server running on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
`
  }
];

export const SAMPLE_BAD_BLOG = {
  title: "Solving Distributed Microservice Latency: Mapping Traces and Winston Logs with OpenTelemetry and SigNoz",
  content: `Last week, our checkout microservice started intermittently failing. While our p95 metrics looked stable at 240ms, our p99 response times surged to over 5.4 seconds. These edge-case timeouts caused several payment confirmation delays, leaving our team searching through thousands of unlinked backend logs. Our primary centralized logging platform did not provide trace-context linking, meaning we had no easy way to associate a failing downstream database query with the initial frontend transaction.

To resolve this issue once and for all, I deployed OpenTelemetry and configured SigNoz to establish complete observability across our API gateway and order processing servers. By binding trace IDs directly into our Winston structured logger, we achieved instant trace-to-log correlation. Here is a step-by-step account of our architecture setup, configuration files, and how we identified the slow database lock.

### The Staging Architecture
Our transaction pipeline is built using Node.js services executing on AWS ECS containers:
1. **API Gateway (Express.js)**: Receives user traffic and creates parent trace spans.
2. **Order Processing Service (Node.js)**: Performs database queries and handles transactional states.
3. **Winston Logger**: Formats all output messages in structured JSON formats.
4. **SigNoz (ClickHouse backend)**: Aggregates, correlates, and visualizes all OTel telemetry data.

### Step 1: Spinning Up SigNoz Locally and on ECS
First, I pulled down the official SigNoz deployment workspace using the standard installer to build our development testbed:
\`\`\`bash
git clone -b main https://github.com/SigNoz/signoz.git
cd signoz/deploy
./install.sh
\`\`\`
Within five minutes, the install script successfully initialized ClickHouse, the OTel Collector, and the Query Service. I verified the local dashboard by navigating to port \`3301\`. The frontend displayed our live telemetry interface, showing system metric graphs and active OTLP streams immediately.

![SigNoz Main Interface](/src/assets/images/signoz_dashboard_1784010104343.jpg)
*Caption: SigNoz interface monitoring active resource usages and telemetry collection pipelines.*

### Step 2: Instantiating the OpenTelemetry Node SDK
Next, I installed the OpenTelemetry dependencies required to instrument our application code:
\`\`\`bash
npm install @opentelemetry/sdk-node \\
  @opentelemetry/auto-instrumentations-node \\
  @opentelemetry/exporter-trace-otlp-grpc \\
  @opentelemetry/exporter-metrics-otlp-grpc \\
  winston
\`\`\`

I created a dedicated \`telemetry.ts\` entrypoint file to load the NodeSDK prior to importing any other module or application code. This ensures all HTTP and PG drivers are correctly wrapped for automatic auto-instrumentation:

\`\`\`typescript
// telemetry.ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";

const sdk = new NodeSDK({
  serviceName: "order-processing-service",
  traceExporter: new OTLPTraceExporter({
    url: "http://localhost:4317/v1/traces"
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: "http://localhost:4317/v1/metrics"
    })
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-winston": {
        enabled: true,
        logHook: (span, record) => {
          // Inject trace context parameters to link our JSON logs with our flamegraphs
          record["resource.service.name"] = "order-processing-service";
        }
      }
    })
  ]
});

sdk.start();
console.log("OpenTelemetry SDK successfully started and monitoring active spans.");
\`\`\`

### Step 3: Setting Up Winston Structured Logging with Span Correlation
To capture clear, query-level telemetry, we needed our Winston logger to match our trace scopes. Here is our Winston configuration, utilizing the standard OpenTelemetry instrumentations to inject current trace IDs into our JSON log streams:

\`\`\`javascript
// logger.ts
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

module.exports = logger;
\`\`\`

Because we activated \`@opentelemetry/instrumentation-winston\` in our initialization script, OpenTelemetry automatically injects active context parameters (including \`trace_id\`, \`span_id\`, and \`trace_flags\`) directly into Winston log metadata records.

![Log to Trace Mapping](/src/assets/images/signoz_logs_correlation_1784010147556.jpg)
*Caption: Related logs panel inside SigNoz visualizing Winston JSON output matched exactly with our active distributed traces.*

### Step 4: Tracking the 5-Second Checkout Leak
Once our staging service was fully instrumented, I simulated checkout orders and triggered the latency spikes. I logged into our SigNoz platform, navigated to the **Traces** tab, and sorted by transaction duration. 

Sure enough, we identified several checkout spans taking up to **5.4 seconds**. I clicked on a failing trace, which loaded the flamegraph display panel. The distributed flamegraph illustrated the exact operation breakdown:
- Parent span \`POST /api/checkout\` (5.42 seconds)
  - Child span \`POST /charge\` (3.2 seconds) - Payment Gateway Delay
  - Nested child \`SELECT * FROM active_orders WHERE user_id = $1\` (2.1 seconds) - Database Lock

By inspecting the nested PostgreSQL query block, we found that our checkout transaction was executing a locking SELECT query synchronously before verifying the payment token. Under concurrency, this forced database queries to serialize, locking up resources and driving latency up.

![N+1 Loop Visualization](/src/assets/images/signoz_flamegraph_1784010119839.jpg)
*Caption: Flamegraph layout showing consecutive database locks and slow execution times.*

We quickly deployed an optimized check that queries product inventories before opening the transactional database scope. The latency dropped instantly to under **110ms**!

![Post Optimization Latency Drop](/src/assets/images/signoz_latency_drop_1784010133301.jpg)
*Caption: Post-fix latency performance showing immediate return to baseline response times.*

### Advanced Configuration Enhancements
When taking OpenTelemetry to production environments, consider these important optimizations to control data ingestion volumes:

#### 1. Configuring Trace Sampling Rate
To avoid storing millions of trivial HTTP 200 health check traces, you can configure trace sampling ratios inside the Node SDK:
\`\`\`typescript
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-node';

const sdk = new NodeSDK({
  sampler: new TraceIdRatioBasedSampler(0.2), // Record only 20% of traces
  serviceName: 'order-processing-service'
});
\`\`\`

#### 2. Scrubbing Sensitive Transactional Fields
Always mask sensitive fields (like credit card payload parameters or personal authentication keys) at the collector layer using redaction processor pipelines before they are written to disk.

### Lessons Learned & Takeaways
- **Correlating traces and logs is invaluable**: Raw logs are hard to map without contextual span IDs. Bringing them together into SigNoz transforms scattered logging lines into an actionable diagnostic stream.
- **Instrument early to prevent production blindspots**: Having the OpenTelemetry instrumentation layer active in our staging environments allowed us to detect the database locking bug long before it could affect live customers.
- **Configure sampling to manage storage costs**: Storing 100% of telemetry traces is rarely necessary for statistical analysis. Applying a 10% to 20% trace sampling rate maintains full diagnostic confidence while reducing database load significantly.

### Conclusion
By leveraging OpenTelemetry alongside SigNoz and Winston structured log correlation, we transformed our microservice telemetry from a series of scattered files into a unified dashboard. We identified and patched a 5-second database lock, optimization that shaved off 97% of checkout latency. 

For complete documentation on setting up multi-service tracing and custom clickhouse aggregations, visit the official [SigNoz documentation](https://signoz.io/docs/) and explore [SigNoz on GitHub](https://github.com/SigNoz/signoz) to join their vibrant developer community!
`
};

export const SAMPLE_GOOD_BLOG = {
  title: "Debugging a 3-Second API Delay: How I Instrumented my Node Express App with OpenTelemetry & SigNoz",
  content: `Last Wednesday at 2 AM, our production checkout page started crawling. Our payment gateway API response times spiked from 180ms to over 3.2 seconds. Users were abandoning carts in droves, and our server logs just showed generic HTTP 200 OKs with no explanation of where the bottleneck was occurring. 

I needed a definitive answer, so I instrumented our service with OpenTelemetry and SigNoz to map our requests and trace the exact latency path. Here is exactly how I set it up in 30 minutes, how we used SigNoz metrics, custom dashboards, and Slack alerts, and the precise database query loop that was causing the stall.

### The Target Architecture
We have a standard Node.js Express API server communicating with a PostgreSQL database. I wanted to monitor:
1. HTTP request latencies and response codes.
2. PostgreSQL database query duration.
3. Call durations to our external Stripe gateway.

### Step 1: Getting SigNoz Up locally
I downloaded the SigNoz installer directly to our development sandbox server.
\`\`\`bash
git clone -b main https://github.com/SigNoz/signoz.git
cd signoz/deploy
./install.sh
\`\`\`
It took about 4 minutes to spin up ClickHouse, the frontend UI, and the SigNoz OTLP collector. I verified the installation by opening the UI at \`http://localhost:3301\` and was greeted by the default metrics panel, showing CPU utilization, memory metrics, and active OTLP ingest streams right out of the box.

![SigNoz Initial Dashboard](/src/assets/images/signoz_dashboard_1784010104343.jpg)
*Caption: Default development sandbox metrics panel displayed on the SigNoz homepage dashboard.*

### Step 2: Instrumenting Express.js & Setting Up Trace-to-Log Correlation

To get deeper production insights, I wanted our application logs to correlate directly with our distributed traces. This ensures that when you click on a slow trace inside the SigNoz UI, you can instantly navigate to see the exact log details generated during that specific query failure.

I began by pulling down the essential OpenTelemetry SDK dependencies alongside \`winston\` to manage our structured JSON logs:
\`\`\`bash
npm install @opentelemetry/sdk-node \\
  @opentelemetry/auto-instrumentations-node \\
  @opentelemetry/exporter-trace-otlp-grpc \\
  @opentelemetry/exporter-metrics-otlp-grpc \\
  winston
\`\`\`

I then created an \`instrumentation.ts\` file to initialize the Node SDK before any other module loads:
\`\`\`typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

const sdk = new NodeSDK({
  serviceName: 'checkout-service',
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4317'
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'http://localhost:4317'
    })
  }),
  instrumentations: [
    getNodeAutoInstrumentations()
  ]
});

sdk.start();
console.log("OTel Node SDK initialized!");
\`\`\`

Next, I configured our application logger using \`winston\` inside a separate \`logger.ts\` file. Since we are using standard Node auto-instrumentation, OpenTelemetry automatically hooks into \`winston\` to inject the active context (\`trace_id\` and \`span_id\`) directly into every log record without any manual mapping:

\`\`\`javascript
const winston = require('winston');
// The Winston auto-instrumentation will automatically inject trace_id and span_id into metadata parameters. Ensure WinstonInstrumentation is added to the instrumentations array in telemetry.ts:
// new WinstonInstrumentation({ enabled: true })
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // SigNoz parses structured JSON logs with high efficiency
  ),
  transports: [
    new winston.transports.Console()
  ]
});

module.exports = logger;
\`\`\`

I integrated this logger into our Express checkout router to catch lifecycle updates:
\`\`\`javascript
app.post('/api/checkout', async (req, res) => {
  logger.info('Processing checkout session initialization', { userId: req.body.userId });
  // Database logic follows here...
});
\`\`\`

I loaded the entire instrumentation at startup by running:
\`\`\`bash
node --import tsx/register instrumentation.ts index.ts
\`\`\`

Once that was in place, SigNoz could seamlessly stitch our logs and traces together. When diving into the 3.2-second flamegraph screen, we can now click directly on the "Related Logs" tab to see exactly what happened during that query stall.

![SigNoz Related Logs Correlation](/src/assets/images/signoz_logs_correlation_1784010147556.jpg)
*Caption: Structured JSON logs automatically filtered and correlated in SigNoz ClickHouse using the Trace ID.*

### Step 3: Finding the 3.2-Second Culprit (Expanded)
After running a few mock checkouts, I jumped over to the SigNoz "Traces" tab. I filtered by our \`checkout-service\` and sorted by duration. Sure enough, there were several traces peaking at exactly **3.22 seconds**. 

I clicked on the slowest trace, opening the flamegraph panel. Inspecting the distributed flamegraph on the SigNoz UI immediately visualized the latency hierarchy. The primary parent span, \`POST /api/checkout\`, stretched out across a long timeline of 3.22 seconds (with matching transactional blocks taking up to 4.12 seconds in simulated high concurrency). By drilling directly into the span details pane, we observed a sequence of nested database operations execution blocks. The auto-instrumented PostgreSQL driver (\`pg\`) flagged 14 identical SELECT queries running synchronously, each consuming ~220ms. This visualization made the classic N+1 loop unmistakable.

![SigNoz Flamegraph N+1 Query Problem](/src/assets/images/signoz_flamegraph_1784010119839.jpg)
*Caption: SigNoz Flamegraph panel displaying 14 sequential database pg.query executions clearly.*

This was a classic **N+1 query problem** that was invisible in the console but glaringly obvious inside the SigNoz timeline.

### How I Fixed It
I rewrote our ORM checkout handler to batch fetch the users in a single query:
\`\`\`typescript
// BEFORE: 14 separate sequential queries
for (const item of cartItems) {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [item.userId]);
}

// AFTER: A single optimized batch query
const userIds = cartItems.map(i => i.userId);
const users = await db.query('SELECT * FROM users WHERE id = ANY($1)', [userIds]);
\`\`\`

After deploying the patch, the checkout traces dropped instantly to **145ms**.

![SigNoz Post-Fix Latency Drop](/src/assets/images/signoz_latency_drop_1784010133301.jpg)
*Caption: Latency graph showing an instant drop to 145ms after deploying our optimized batch query patch.*

### Step 5: Setting Up Proactive Alerts in SigNoz
Fixing the bug was great, but I wanted to ensure we were alerted *before* users started abandoning carts in the future. I utilized the **SigNoz Alerts** manager to build an automated alert system.

1. I navigated to the **Alerts** tab in the SigNoz UI and clicked **New Alert Rule**.
2. Using the intuitive Query Builder, I selected our \`checkout-service\` and set the metric to track **p99 Latency**.
3. I configured a threshold condition: If the p99 latency of \`/api/checkout\` exceeds \`500ms\` for more than 3 consecutive minutes, trigger a **Critical Alert**.
4. Finally, I integrated our engineering Slack channel via webhooks. Now, if the database or external APIs slow down again, our team receives an immediate notification with a direct link to the offending SigNoz trace dashboard.

### Step 6: Custom APM Dashboards for Executive Visibility
To give our DevOps team a bird's-eye view of our system health, I built a custom **SigNoz Dashboard**. 

Instead of jumping between logs and traces, I created a single unified panel that tiles:
- **HTTP Error Rates (4xx and 5xx responses)**.
- **P95/P99 Latency Trends** of our core API routes.
- **Database Connection Pool Saturation** metrics.

Because SigNoz uses **ClickHouse** under the hood, querying millions of data points to render these dashboards takes less than a second. With our custom dashboards, the results of our batch query optimization became immediately apparent: we witnessed a **65% drop in CPU utilization** and a **45% drop in memory (RAM) usage** on our service host, while ClickHouse storage utilization stayed extremely flat due to its incredible columnar compression. This dashboard now sits on a monitor in our ops room, providing real-time infrastructure visibility.

### Step 7: Capturing Silent Failures with OTel Exceptions
Sometimes queries don't just slow down; they fail completely due to database timeouts. Standard logs often bury these stack traces. With OpenTelemetry, any uncaught exception in our Express routes is automatically captured.

Inside the **SigNoz Exceptions** tab, I can see a grouped view of all runtime errors, complete with stack traces, frequency counts, and the exact line of code that threw the error. This helped us isolate a silent \`JSON.parse\` error in our webhook handler that was previously masked by generic HTTP 500 status codes.

### Technical Production Gotchas & Best Practices (gRPC vs HTTP/JSON and Env Vars)
While setting up OpenTelemetry via \`getNodeAutoInstrumentations()\` is highly efficient, I hit a major production gotcha regarding networking, firewalls, and ports. By default, the \`OTLPTraceExporter\` attempts to connect over port \`4317\` using the **gRPC** protocol. 

While gRPC is highly performant and works perfectly in local Docker sandboxes, our staged cloud environment (AWS) had strict network security groups, firewalls, and corporate proxy rules that completely blocked long-lived gRPC streaming connections on port 4317. This caused the OTel Node SDK to hang and silently drop packets without throwing a single readable error in our log outputs.

To resolve this without altering our underlying code or rebuilding Docker containers, I learned that we should configure the SDK to export via port \`4318\` using **HTTP/JSON (Protobuf)**, which is much more firewall-friendly and standard. I also replaced our hardcoded SDK configs with standard OpenTelemetry environment variables to keep the code cloud-native and dynamically configurable.

Instead of hardcoding endpoint URLs in our codebase, we now export standard environment variables during our deployment process:

\`\`\`bash
export OTEL_SERVICE_NAME="checkout-service-prod"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://signoz-collector.internal:4318"
export OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
\`\`\`

Switching the endpoint protocol to \`http/protobuf\` and the destination to port \`4318\` completely resolved the silent timeouts. It allowed our staging and production servers to communicate through firewalls cleanly. For web contexts, if CORS issues ever emerge when pushing telemetry directly from browser-side apps, routing traffic through a local reverse proxy or utilizing these environment variables ensures secure, same-origin telemetry paths.

### Advanced Production Enhancements (Advanced Production Optimizations & Security)

When deploying our application in a real production environment, we had to navigate several critical configurations and enhancements to keep our systems stable and secure:

#### 1. Trace Sampling & Code Optimization
In high-traffic production environments, capturing 100% of telemetry traces can introduce unnecessary performance overhead and fill up disk storage. Implementing trace sampling is highly critical. By configuring a sampling rate, we can selectively report e.g., 10% or 20% of requests to SigNoz without losing statistical insight.

Your \`instrumentation.ts\` config file should include the \`sampler\` parameter like this:
\`\`\`typescript
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-node';

const sdk = new NodeSDK({
  // Captures only 10% of total traces in production (Trace Sampling)
  sampler: new TraceIdRatioBasedSampler(0.1), 
  serviceName: 'nodejs-http-function',
  // ... further configuration
});
\`\`\`

#### 2. Telemetry Security Guardrails (PII Data Masking)
When users input critical information such as credit card credentials or passwords, the OpenTelemetry auto-instrumentation library might inadvertently serialize this data inside transactional attribute tags. This poses a major data security risk.

To solve this, we should enforce **PII (Personally Identifiable Information) Data Masking** at the collector layer. By configuring the \`redaction\` or \`attributes\` processors in our SigNoz Collector config YAML, we can block or mask passwords, session tokens, or card numbers before they get ingested into our database:
\`\`\`yaml
processors:
  redaction:
    allowed_keys:
      - description
      - group
    blocked_values:
      - "password"
      - "credit_card"
\`\`\`

#### 3. Serverless Cold Starts in Cloud Environments (Google Cloud Functions)
When hosting your API on serverless platforms like Google Cloud Functions (2nd Gen) or AWS Lambda, container cold starts present a unique challenge. Since cold instances boot on-demand, initializing the OpenTelemetry SDK on start adds additional load overhead to the very first request.

**The Fix:** Deploy your functions with a min-instances flag (e.g., \`gcloud functions deploy --min-instances 1\`). This ensures at least one container instance stays warm, completely eliminating initial cold-start latencies introduced by telemetry SDK bootup processes.

#### 4. Build Optimization via Cloud Build & Artifact Registry
Deploying serverless functions or containers usually triggers container build pipelines (like Google Cloud Build) in the background. If your package manifests include heavy telemetry dependencies, build times can increase drastically.

**The Fix:** Ensure your \`.gcloudignore\` file lists \`node_modules\`, testing logs, and static mock files. This stops unnecessary assets from uploading, accelerating your cloud compilation times significantly.

### What I Learned & Team Impact
When our development team logged in on Thursday morning, we finally had complete, cross-stack telemetry at our fingertips through the SigNoz dashboard. Being able to visualize latency breakdowns and CPU graphs side-by-side completely eliminated finger-pointing between the backend, database, and front-end teams.

In the future, we plan to utilize SigNoz as a fundamental gatekeeper in our production environments. We are integrating SigNoz alerts into our automated canary release pipelines, allowing us to auto-rollback deployments if p99 latency spikes or ClickHouse error rate metrics fluctuate. Having real-time tracing and automated alert notifications changed how we ship code; it is now a core pillar of our engineering velocity. If you want to configure this for your own stack, check out the guides on the official SigNoz documentation site at https://signoz.io/docs/ !

### Lessons Learned & Takeaways
- **Auto-instrumentation is powerful but heavy**: Leveraging \`getNodeAutoInstrumentations\` is great for immediate setups, but in production, you should selectively enable instrumentations (like HTTP, PG, Express) to keep execution overhead low.
- **Uncaught exceptions context**: Standard middleware error catching doesn't always automatically attach stack traces to spans unless you explicitly record the exception.

### Conclusion
In less than an hour, we went from guessing why our pipeline was dragging to deploying a verified database array-query fix that shaved off 97% of our latency. To try this yourself, check out [SigNoz on GitHub](https://github.com/SigNoz/signoz).
`
};

export const SAMPLE_TELUGU_BLOG = {
  title: "Detecting 3-Second API Latency: How to Instrument a Node.js Express App with OpenTelemetry & SigNoz",
  content: `Last Wednesday night at 2:14 AM, our production checkout gateway came to a grinding halt. Our client-side alerts started flaring up as checkout payment pages took an average of 3,200ms to load, up from our usual 180ms baseline. Users were abandoning their carts in massive volumes, and our support channels were flooded. 

When I opened our centralized log management tool to find the cause, I was met with complete silence. The logs displayed a series of generic "HTTP 200 OK" lines. Because we had no correlation between our log lines and the transactional lifecycle of the requests, we had no reliable way to map which downstream database queries or third-party webhooks were slowing down the checkout experience.

Instead of playing a guessing game or blindly restarting servers, I decided to instrument our microservice using **OpenTelemetry** and connect it to **SigNoz** as our primary APM dashboard. Within 30 minutes, we went from complete blindness to tracing a hidden, synchronous database loop with surgical precision. 

In this comprehensive, step-by-step production tutorial, I will show you exactly how to configure the OpenTelemetry Node SDK, set up structured Winston log correlation, run SigNoz via Docker Compose, and debug common distributed tracing bottlenecks in production environments.

---

### The Anatomy of Our Telemetry Stack

Before diving into code, it is essential to understand the architectural flow of how metrics, traces, and logs propagate through a modern, open-standard observability system:

\`\`\`
   +-------------------------------------------------------------+
   |                     Node.js Express App                     |
   |                                                             |
   |   [ Winston JSON Logger ]      [ Express Router Handler ]   |
   |              |                              |               |
   |              +--------------+---------------+               |
   |                             |                               |
   |              [ OpenTelemetry Auto-Instrumentation ]          |
   +-----------------------------|-------------------------------+
                                 | (OTLP Proto over Port 4318)
                                 v
   +-------------------------------------------------------------+
   |                     SigNoz Collector Host                   |
   |                                                             |
   |                [ OpenTelemetry Collector ]                  |
   |                             |                               |
   |                             v                               |
   |                  [ ClickHouse Columnar DB ]                 |
   |                             |                               |
   |                             v                               |
   |                   [ SigNoz Query Engine ]                   |
   |                             |                               |
   |                             v                               |
   |                    [ SigNoz React UI ]                      |
   +-------------------------------------------------------------+
\`\`\`

1. **Express API Server**: Handles standard incoming HTTP traffic and interacts with database tables.
2. **OpenTelemetry Node SDK**: Hooks into standard Node.js module loading (using monkey-patching wrapper libraries) to dynamically measure and intercept HTTP requests, database driver executions, and logger events on the fly.
3. **OTLP Exporter**: Formats our captured telemetry data (using protocol buffers) and pushes it as standardized OTLP payloads.
4. **SigNoz Collector**: Receives incoming telemetry streams, processes them through filtering pipelines, and stores them inside a high-performance ClickHouse database.
5. **ClickHouse Backend**: A high-efficiency, columnar database that compresses millions of telemetry records and allows analytical queries to execute in sub-millisecond timelines.

---

### Step 1: Spinning Up SigNoz Locally via Docker Compose

To begin collecting traces, we need to run a local receiver. SigNoz provides a highly optimized, production-ready Docker Compose environment that bundles ClickHouse, the OTel Collector, and their visualization engine.

Let's pull down the official SigNoz deployment project and initialize it:

\`\`\`bash
# Clone the official repository containing the deploy orchestrations
git clone -b main https://github.com/SigNoz/signoz.git
cd signoz/deploy

# Execute the automated bootstrap setup script
./install.sh
\`\`\`

Behind the scenes, the setup script configures several services inside a custom Docker bridge network:
- **clickhouse**: Configured as our primary columnar analytics database.
- **otel-collector**: Acts as the ingestion gateway, listening for OTLP gRPC (port 4317) and OTLP HTTP (port 4318) payloads.
- **query-service**: Interacts with ClickHouse to aggregate spans, error logs, and metrics.
- **frontend**: The React user interface running on port **3301**.

Once the CLI outputs a success message, navigate to \`http://localhost:3301\` to verify that your local dashboard is fully initialized.

![SigNoz Initial Dashboard](/src/assets/images/signoz_dashboard_1784010104343.jpg)
*Caption: The default SigNoz landing page showing active telemetry streams, collector ingestion, and host resource utilization panels.*

---

### Step 2: Instrumenting the Node.js Express Application

To begin measuring telemetry in a Node.js ecosystem, we must initialize the OpenTelemetry SDK before *any* other application files are imported. This is a crucial requirement because libraries like Express and PG must be intercepted at require-time to inject tracing wrappers.

First, let's install the official OpenTelemetry SDK packages alongside our Winston logger:

\`\`\`bash
npm install @opentelemetry/sdk-node \\
  @opentelemetry/auto-instrumentations-node \\
  @opentelemetry/exporter-trace-otlp-grpc \\
  @opentelemetry/exporter-metrics-otlp-grpc \\
  winston
\`\`\`

Now, create a dedicated \`instrumentation.ts\` file in your workspace:

\`\`\`typescript
// instrumentation.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-node';

// Set up the Node SDK configuration
const sdk = new NodeSDK({
  // Only capture 10% of total traces in production to manage storage size (Trace Sampling)
  sampler: new TraceIdRatioBasedSampler(0.1),
  
  serviceName: 'checkout-service',
  
  // Export traces directly to our local OTel Collector
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4317'
  }),
  
  // Aggregate and push hardware metrics periodically
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'http://localhost:4317'
    })
  }),
  
  // Enable auto-instrumentation for all common framework dependencies
  instrumentations: [
    getNodeAutoInstrumentations({
      // We can customize behavior for individual wrappers here
      '@opentelemetry/instrumentation-fs': {
        enabled: false // Disable noisy file-system reads to keep trace views clean
      }
    })
  ]
});

// Boot the OpenTelemetry SDK
sdk.start();
console.log("OpenTelemetry Node.js SDK initialized successfully.");
\`\`\`

---

### Step 3: Setting Up Structured Logs with Trace Correlation

When debugging production issues, having raw trace flamegraphs is only half the battle. If a checkout fails, you need to see the exact application logs generated during that transaction adjacent to the flamegraph timeline.

To achieve this, we will use Winston to output JSON-formatted logs. The OpenTelemetry auto-instrumentation will intercept Winston and dynamically inject \`trace_id\` and \`span_id\` metadata fields into every log line:

\`\`\`javascript
// logger.ts
const winston = require('winston');

// Create our global structured logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // SigNoz reads and indexes structured JSON with high performance
  ),
  transports: [
    new winston.transports.Console()
  ]
});

module.exports = logger;
\`\`\`

Next, import and utilize our logger within our core Express checkout route:

\`\`\`javascript
// checkoutRouter.js
const express = require('express');
const logger = require('./logger');
const router = express.Router();

router.post('/api/checkout', async (req, res) => {
  // OpenTelemetry automatically captures this log and embeds the active Trace ID
  logger.info('Processing checkout session initialization', { 
    userId: req.body.userId,
    cartTotal: req.body.total
  });
  
  // Transaction processing logic...
});
\`\`\`

To run your application with the OpenTelemetry SDK loaded first, run:

\`\`\`bash
# Load telemetry instrumentation before running the main index file
node --import tsx/register instrumentation.ts index.ts
\`\`\`

With trace correlation active, SigNoz seamlessly maps logs with their traces, letting you debug errors with zero friction!

![SigNoz Related Logs Correlation](/src/assets/images/signoz_logs_correlation_1784010147556.jpg)
*Caption: SigNoz interface displaying structured JSON logs automatically grouped and filtered by Trace ID alongside the trace flamegraph.*

---

### Step 4: Finding the 3.2-Second Latency Bottleneck

With our application fully instrumented, I simulated concurrency on our checkout routes. Within minutes, multiple trace entries inside our SigNoz panel flagged response durations stretching up to **3.22 seconds**.

By clicking on a slow checkout trace, I was presented with the detailed flamegraph view. The visualization showed our primary parent span, \`POST /api/checkout\`, extending across the entire 3.2-second timeline. Directly below the parent block, the timeline was cluttered with 14 identical database operations (\`pg.query\`), each taking approximately 220ms and running sequentially (synchronously).

This was a textbook N+1 query loop! Our route handler was sequentially querying user account records inside a loop instead of utilizing an optimized batch fetching mechanism.

![SigNoz Flamegraph N+1 Query Problem](/src/assets/images/signoz_flamegraph_1784010119839.jpg)
*Caption: Detailed flamegraph visualizing the series of blocking, sequential database queries that caused our checkout latency to spike.*

---

### The Optimized Query Refactoring

To resolve this issue, I refactored our router controller. Instead of triggering a separate database query for each individual cart item within a synchronous loop, I modified the logic to build a single optimized batch query using the PostgreSQL \`ANY\` operator:

\`\`\`typescript
// BEFORE: 14 sequential database trips
for (const item of cartItems) {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [item.userId]);
}

// AFTER: A single optimized batch query
const userIds = cartItems.map(i => i.userId);
const users = await db.query('SELECT * FROM users WHERE id = ANY($1)', [userIds]);
\`\`\`

Once the optimized query patch was pushed to staging, checkout trace durations fell instantly to a baseline response time of just **145ms**—producing an immediate **95%+ performance speedup**!

![SigNoz Post-Fix Latency Drop](/src/assets/images/signoz_latency_drop_1784010133301.jpg)
*Caption: Metrics panel displaying the dramatic latency decline on our checkout endpoints following our optimization release.*

---

### Step 5: Configuring Proactive Alerting & Slack Integrations

To ensure our team gets notified of slow endpoints or service bottlenecks before they affect our end-users, we can configure automated alerting policies inside SigNoz:

1. Click on the **Alerts** tab inside the SigNoz dashboard and select **New Alert Rule**.
2. Set the target metric to monitor **p99 Latency** for our \`checkout-service\`.
3. Set the threshold conditions: If the p99 latency rises above **500ms** for more than **3 minutes**, trigger a critical alert.
4. Hook up your internal team **Slack** channel using a Webhook URL.

SigNoz will now monitor the ClickHouse storage engine and dispatch a rich notification payload directly to your chat channel containing direct links to the failing distributed traces if latency spikes occur again.

---

### Production Best Practices & Deployment Guidelines

When running OpenTelemetry and SigNoz under high-traffic production environments, follow these critical guidelines to ensure reliability, security, and low cost:

#### 1. Avoid gRPC Firewall Failures (gRPC vs HTTP/JSON Protobuf)
By default, the OpenTelemetry SDK attempts to export traces over port \`4317\` using the **gRPC** protocol. While gRPC is highly efficient, many cloud firewalls, AWS security groups, or enterprise proxies block or throttle gRPC streaming. 

If your traces are mysteriously failing to show up on your dashboard with zero console logs, change the connection setup to export via port \`4318\` using **HTTP/Protobuf**. You can achieve this dynamically without editing code by configuring these standard environment variables in your deployment pipeline:

\`\`\`bash
# Configure standard cloud-native OTel configurations
export OTEL_SERVICE_NAME="checkout-service-prod"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://signoz-collector.internal:4318"
export OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
\`\`\`

#### 2. Implement PII Data Masking Security
Because auto-instrumentation hooks into all raw database queries and HTTP request payloads, there is a serious risk of accidentally capturing sensitive customer variables (such as credit card numbers, passwords, or personal authentication tokens). 

To prevent data leaks, customize your SigNoz Collector configuration YAML to redact sensitive attributes at the ingestion pipeline before they are written to the database:

\`\`\`yaml
# otel-collector-config.yaml
processors:
  redaction:
    allowed_keys:
      - description
      - service.name
    blocked_values:
      - "password"
      - "credit_card"
      - "token"
\`\`\`

#### 3. Handle Serverless Cold Starts (Google Cloud Functions)
If you deploy your microservices on serverless backends like Google Cloud Functions (2nd Gen) or Cloud Run, container cold starts can introduce initial setup overhead. Running the OpenTelemetry SDK boot sequence adds slight delay to the very first cold request. 

To completely eliminate cold-start latencies, deploy your services with a minimum instances flag (e.g., \`--min-instances 1\`). This ensures at least one container instance remains warm and active to handle incoming requests instantly.

#### 4. Speed Up Deployment Build Times (Google Cloud Build)
Including robust telemetry SDK dependencies can occasionally inflate container image sizes and increase deployment compilation times under engines like Google Cloud Build. 

Make sure your project root contains a optimized \`.gcloudignore\` file to exclude local directories like \`node_modules/\` or static workspace testing logs. This prevents bulky files from uploading to the cloud, accelerating your deploy times significantly.

---

### Conclusion

Observability is not just about measuring system errors—it is about having absolute structural visibility into your application lifecycle. By instrumenting our Express server with OpenTelemetry, correlating Winston JSON logs, and utilizing SigNoz with ClickHouse columnar storage, we went from zero insights to diagnosing and patching a major database bottleneck in less than an hour.

To begin instrumenting your own stack, check out the official developer guides on the [SigNoz Documentation site](https://signoz.io/docs/) and join their active community on the [SigNoz GitHub repository](https://github.com/SigNoz/signoz)!
`
};


export const SAMPLE_ENGLISH_TRANSLATED_BLOG = {
  title: "Detecting 3-Second API Latency: How to Instrument a Node.js Express App with OpenTelemetry & SigNoz",
  content: `Last Wednesday night at 2 AM, our production website's payment page slowed down dramatically. Our payment gateway response time spiked from 180ms to over 3.2 seconds. Users began abandoning their carts and canceling orders. Our normal server logs only showed generic "HTTP 200 OK" lines but couldn't point out where the issue actually lay.

Instead of guessing, I decided to resolve this by instrumenting our service with OpenTelemetry and SigNoz. Here is a step-by-step breakdown of how I configured the telemetry setup in 30 minutes, built a custom metrics dashboard, and tracked down a hidden database N+1 query loop.

### The Target Architecture
We run a standard Node.js Express API server backed by a PostgreSQL database. I wanted to monitor:
1. HTTP request latency and response status codes.
2. PostgreSQL database query execution run times.
3. Outgoing external Stripe payment gateway calls.

### Step 1: Setting Up SigNoz Locally
First, I cloned the official SigNoz installer onto our development sandbox server:
\`\`\`bash
git clone -b main https://github.com/SigNoz/signoz.git
cd signoz/deploy
./install.sh
\`\`\`
In just 4 minutes, ClickHouse, the OTLP Collector, and the SigNoz Web UI were fully running. Navigating to \`http://localhost:3301\` loaded the main interface, showing CPU, memory, and active OTLP ingestion streams immediately.

![SigNoz Initial Dashboard](/src/assets/images/signoz_dashboard_1784010104343.jpg)
*Caption: Development sandbox metrics panel on the SigNoz homepage.*

### Step 2: Express.js Instrumentation & Logs Correlation
When debugging a slow request trace, having related logs mapped directly adjacent to the trace flamegraph makes troubleshooting ten times easier.

I installed the required OpenTelemetry dependencies:
\`\`\`bash
npm install @opentelemetry/sdk-node \\
  @opentelemetry/auto-instrumentations-node \\
  @opentelemetry/exporter-trace-otlp-grpc \\
  @opentelemetry/exporter-metrics-otlp-grpc \\
  winston
\`\`\`

Then, I created \`instrumentation.ts\` to configure the OpenTelemetry Node SDK:
\`\`\`typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

const sdk = new NodeSDK({
  serviceName: 'checkout-service',
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4317'
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'http://localhost:4317'
    })
  }),
  instrumentations: [
    getNodeAutoInstrumentations()
  ]
});

sdk.start();
console.log("OTel Node SDK initialized!");
\`\`\`

To enable structured JSON logs and correlate them automatically with current traces, I used \`winston\` to create \`logger.ts\`. OpenTelemetry automatically injects \`trace_id\` and \`span_id\` directly into Winston's output records:
\`\`\`javascript
const winston = require('winston');
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // SigNoz parses structured JSON logs seamlessly
  ),
  transports: [
    new winston.transports.Console()
  ]
});
module.exports = logger;
\`\`\`

I then imported our logger inside our Express route handler:
\`\`\`javascript
app.post('/api/checkout', async (req, res) => {
  logger.info('Processing checkout session initialization', { userId: req.body.userId });
  // Database logic...
});
\`\`\`

To run the application with telemetry initialized first, I used the following command:
\`\`\`bash
node --import tsx/register instrumentation.ts index.ts
\`\`\`

With this in place, our structured logs and distributed traces became perfectly linked!

![SigNoz Related Logs Correlation](/src/assets/images/signoz_logs_correlation_1784010147556.jpg)
*Caption: Related logs panel in SigNoz showing JSON logs filtered automatically using the Trace ID.*

### Step 3: Finding the 3.2-Second Latency Root Cause
I navigated to the **Traces** tab inside the SigNoz dashboard and sorted traces by response duration. I quickly spotted multiple checkout transactions taking exactly **3.22 seconds**.

Clicking on the slow trace loaded its Flamegraph, making the problem glaringly obvious. Beneath the main parent span \`POST /api/checkout\`, there were 14 identical database \`SELECT\` queries executing sequentially (synchronously), with each query consuming roughly 220ms.

This was a textbook **N+1 query problem**! While completely invisible in basic console printouts, it stood out instantly on the SigNoz timeline.

![SigNoz Flamegraph N+1 Query Problem](/src/assets/images/signoz_flamegraph_1784010119839.jpg)
*Caption: Flamegraph panel showing 14 sequential database pg.query executions clearly.*

### The Fix
I refactored the sequential database loop into a single optimized batch query:
\`\`\`typescript
// BEFORE: 14 separate sequential queries
for (const item of cartItems) {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [item.userId]);
}

// AFTER: A single optimized batch query
const userIds = cartItems.map(i => i.userId);
const users = await db.query('SELECT * FROM users WHERE id = ANY($1)', [userIds]);
\`\`\`

After deploying the optimized code, checkout page latency plunged immediately to just **145ms**—achieving a **95%+ performance speedup**!

![SigNoz Post-Fix Latency Drop](/src/assets/images/signoz_latency_drop_1784010133301.jpg)
*Caption: Post-fix latency performance showing immediate return to baseline response times.*

### Step 5: Setting Up Alerts and Dashboards
To ensure our engineering team gets notified of slow responses before customers notice, I configured proactive **SigNoz Alerts**:
1. Navigated to the **Alerts** section in SigNoz and clicked **New Alert Rule**.
2. Configured a threshold rule: If the **p99 latency** of \`checkout-service\` exceeds \`500ms\` for more than 3 minutes, trigger an alert.
3. Integrated the alert with our internal development **Slack** channel using a webhook.

I also built a custom APM dashboard showing CPU usage, memory consumption, and HTTP error rates side-by-side. Because SigNoz uses **ClickHouse** under the hood, running analytical queries over millions of events is extremely fast and has minimal memory footprint due to its columnar data storage compression.

### Technical Production Gotchas & Best Practices (gRPC vs HTTP/JSON)
In production environments (such as AWS ECS or Google Cloud Platform), OpenTelemetry auto-instrumentation attempts to connect to the collector over port \`4317\` using the **gRPC** protocol by default. However, strict firewalls, VPC security groups, or enterprise proxies may block gRPC traffic.

In these situations, switching to **HTTP/JSON (Protobuf)** on port \`4318\` is much more firewall-friendly. You can configure this easily without changing your code by setting standard OTel environment variables in your deployment setup:
\`\`\`bash
export OTEL_SERVICE_NAME="checkout-service-prod"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://signoz-collector.internal:4318"
export OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
\`\`\`

### Advanced Production Enhancements

#### 1. Code Optimization: Setting an Active Sampling Rate
Capturing 100% of telemetry data in high-volume production systems introduces unnecessary overhead and fills up storage fast. Implementing trace sampling allows you to capture a representative subset (e.g., 10% or 20%) of overall traffic.

You can add the \`sampler\` option to your \`instrumentation.ts\` config:
\`\`\`typescript
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-node';

const sdk = new NodeSDK({
  // Capture only 10% of total traces (Trace Sampling)
  sampler: new TraceIdRatioBasedSampler(0.1), 
  serviceName: 'checkout-service',
});
\`\`\`

#### 2. Security Guardrails: Redacting PII Data
OpenTelemetry auto-instrumentation might capture sensitive parameters (such as credit card numbers or raw passwords) in database queries or HTTP headers. This presents a compliance risk.

To prevent leaks, configure **PII (Personally Identifiable Information) Data Masking** in the SigNoz Collector config YAML using redaction processors:
\`\`\`yaml
processors:
  redaction:
    allowed_keys:
      - description
      - group
    blocked_values:
      - "password"
      - "credit_card"
\`\`\`

### Lessons Learned & Takeaways
- **Selective Auto-Instrumentation**: While using \`getNodeAutoInstrumentations\` is convenient, selectively importing only the plugins you need (such as HTTP, Express, PG) reduces runtime overhead and clean up span noise.
- **Exceptions context**: Standard middleware error catching doesn't always automatically attach stack traces to spans unless you explicitly record the exception.

### Conclusion
By leveraging OpenTelemetry alongside SigNoz and Winston structured log correlation, we transformed our microservice telemetry from a series of scattered files into a unified dashboard. We identified and patched a 3.2-second database N+1 lock, optimizing checkout latency by 95%.

To try this on your own stack, check out [SigNoz on GitHub](https://github.com/SigNoz/signoz) and visit the [SigNoz Documentation](https://signoz.io/docs/) to get started!
`
};

export const SAMPLE_AI_INDIA_BLOG = {
  title: "The AI Evolution in India: From Service Paradigm to Sovereign Intellect",
  content: `India is undergoing a fundamental architectural shift in its technological ecosystem. Historically celebrated as the back-office of the world—a hub for software maintenance, business process outsourcing, and IT services—the nation is rapidly transitioning into a primary producer of core artificial intelligence technologies. This evolution is not merely a commercial trend; it is a structural, sovereign movement driven by unique digital public infrastructure, localized open-source language models, and targeted public-private initiatives.

To understand the trajectory of AI in India, we must analyze the specific drivers, sector-level deployments, structural challenges, and the emerging blueprint of Indocentric LLMs (Large Language Models) that are defining this shift.

---

### 1. The Digital Public Infrastructure (DPI) Catalyst

The foundation of India's AI scaling model is radically different from the private-monopoly frameworks seen in Silicon Valley. It is built upon the **India Stack**, a unified set of open APIs and public digital goods that includes Aadhaar (biometric identity), UPI (unified payments interface), and DigiLocker (digital credential storage).

This ecosystem provides two critical advantages for AI deployment:
1. **Structured, High-Velocity Data Pipelines**: UPI processes over 13 billion transactions monthly, creating an unprecedented, high-velocity stream of transactional metadata. When processed through real-time telemetry pipelines, this data allows financial institutions to build high-accuracy fraud detection and credit-scoring models with zero manual friction.
2. **Low Integration Friction**: Because identity, payments, and document verification are standardized, AI developers can deploy intelligent microservices directly onto existing public rails. There is no need to build proprietary user identity verification layers or handle fractured payment gateways.

#### Bhashini: The Multilingual Data Locomotive
A key component of this public infrastructure is **Bhashini**, an AI-led language translation platform initialized by the Ministry of Electronics and Information Technology (MeitY). Bhashini acts as a sovereign data-repository, crowd-sourcing millions of voice records, sentence translations, and localized speech corpora across the 22 scheduled languages of India. This dataset is open to domestic developers, single-handedly solving the "low-resource language" barrier that has historically bottlenecked localized neural networks.

---

### 2. The Rise of Indic LLMs & The Multilingual Challenge

In India, building AI models is fundamentally a multilingual challenge. English-centric models like GPT-4 or Claude 3.5 Sonnet exhibit severe tokenization inefficiencies when processing non-Latin scripts. For Devanagari or Telugu scripts, a single character often requires 3 to 4 times more tokens than English, dramatically inflating inference latency and API query costs.

To overcome this, a new wave of localized, highly optimized Indocentric models has emerged:

#### A. Krutrim (Ola Krutrim)
Krutrim is trained on over 2 trillion tokens of Indian language data. By rebuilding the tokenizer from the ground up to support Devanagari, Gurmukhi, Tamil, Telugu, and Kannada natively, it achieves a 70% reduction in token overhead for Indian scripts compared to LLaMA models. It represents a shift from wrapping English models to training specialized foundational representations.

#### B. Sarvam AI (Gajendra & OpenHathi)
Sarvam AI has focused on open-source contributions, launching **OpenHathi**, an 7-billion parameter model built as a bilingual Hindi-English extension of LLaMA-2. They have focused on training lightweight, high-performance models optimized for low-end mobile CPUs, acknowledging that standard parameter sizes are too computationally heavy for India's mobile-first market.

#### C. Hanooman (BharatGPT Group)
Developed by the CoRover AI startup in collaboration with IIT Bombay, Hanooman is a multilingual suite of models designed to support 11 regional languages natively, with planned expansion to 22 languages. Hanooman targets healthcare, governance, and financial services, utilizing specialized fine-tuning adapters (LoRAs) to process localized domain terminology.

---

### 3. Sectoral Case Studies: AI in Action

The impact of AI in India is best understood by analyzing its deployment in sectors where it acts as a critical scale-multiplier.

#### Case Study I: Precision Agriculture & Soil Diagnostics
Agriculture employs over 43% of India's workforce but remains highly susceptible to monsoon fluctuations, pest outbreaks, and soil nutrient depletion. AI startups are utilizing high-resolution satellite imagery (Sentinel and ISRO datasets) paired with deep convolutional neural networks (CNNs) to perform:
- **Micro-level Soil Health Diagnostics**: Analyzing hyperspectral satellite images to measure soil moisture and organic carbon content remotely.
- **Pest Detection via Mobile Cameras**: Agritech apps allow smallholder farmers to capture photos of damaged leaves. A lightweight MobileNet model running locally on the device diagnoses the pest type and provides treatment instructions in the farmer's native dialect within seconds, requiring minimal cellular bandwidth.

#### Case Study II: Vernacular Healthcare Outreach
The patient-to-doctor ratio in rural India stands at approximately 1:11,000, far below the World Health Organization's recommended 1:1,000. AI is being deployed not to replace doctors, but to screen patient backlogs.
- **Retinal Image Screening**: Handheld fundus cameras integrated with deep-learning classification models screen rural patients for diabetic retinopathy. The AI identifies microaneurysms and retinal hemorrhages, instantly routing positive matches to urban ophthalmologists via mobile networks.
- **Bhashini Voice Triaging**: Local clinics use voice-to-text AI interfaces. A rural patient speaks their symptoms in Marathi; Bhashini converts and translates the speech to English text for a remote specialist, then translates the doctor's response back to Marathi audio.

#### Case Study III: Real-time Credit Scoring for the Unbanked
Millions of small merchants in India do not possess standard credit histories. By analyzing transaction flows on UPI, invoice generation metadata from the Goods and Services Tax (GST) portal, and micro-deposits, deep learning recurrent neural networks (RNNs) generate alternative credit risk assessments. This allows banks to disburse micro-loans to small street vendors within 180 seconds, completely bypassing traditional manual processing bottlenecks.

---

### 4. Technical Hurdles: Hardware, Talent, and Sovereign Compute

Despite rapid progress, India's AI ecosystem faces substantial structural bottlenecks that require systemic intervention:

#### A. The GPU Deficit & Sovereign Compute
High-performance H100 and B200 GPUs are scarce and expensive. Indian research institutes and early-stage startups cannot easily afford thousands of cluster nodes, creating a performance gap in training custom foundational models.

**The Solution:** The Indian Government launched the **IndiaAI Mission** with an allocation of ₹10,372 crore ($1.25 billion). A central pillar of this mission is the establishment of a public-private partnership compute capacity pool, aiming to lease and provide 10,000 GPU nodes at subsidized rates to local developers, researchers, and startups.

#### B. High-Volume Mobile Inefficiencies
Over 90% of Indian internet users access the web via mobile devices, many of which are budget-friendly smartphones with limited RAM and processing cores. Running resource-intensive AI models server-side introduces substantial network latency and API billing costs.

**The Solution:** Local engineers are prioritizing optimization techniques:
- **4-Bit and 8-Bit Quantization**: Shrinking LLMs to execute directly on consumer mobile chips without performance loss.
- **Knowledge Distillation**: Training smaller student models (e.g., 1.5B or 3B parameters) on the synthetic outputs of larger teacher models (70B+), creating hyper-focused, low-latency micro-agents.

#### C. Ethical Boundaries and the DPDP Act
Deploying AI over millions of citizens raises severe data privacy concerns. The passage of the **Digital Personal Data Protection (DPDP) Act, 2023** established strict regulations surrounding user consent, data localization, and data minimization. AI systems must now be designed with "privacy-by-design" architectures:
- **Anonymization Pipelines**: Automatically stripping personal identifiers (Aadhaar numbers, names, phone numbers) from raw text or transactional telemetry streams before they reach LLM training steps.
- **Audit Logging**: Tracking data usage and consent state in decentralized, tamper-proof logs to ensure regulatory compliance.

---

### 5. Architectural Blueprint: Build Your Own Local AI Translation API

To demonstrate how accessible localized AI development has become, let's look at a production-ready Node.js Express server that utilizes local multilingual models to translate regional feedback into standard structured formats:

\`\`\`typescript
// translationServer.ts
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());

// Initialize the Gemini API client server-side
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/analyze-feedback', async (req, res) => {
  const { feedbackText, sourceLanguage } = req.body;
  
  if (!feedbackText) {
    return res.status(400).json({ error: 'Feedback text is required' });
  }

  try {
    // We leverage the gemini-2.5-flash model for high-speed Indic language processing
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: \\\`
        You are an expert Indic language analyst. Analyze the following user feedback written in \\\${sourceLanguage || 'any Indian language'}.
        
        Feedback: "\\\${feedbackText}"
        
        Provide your output in valid, raw JSON with the following schema:
        {
          "englishTranslation": "The direct translation",
          "sentiment": "positive | neutral | negative",
          "coreIssueCategory": "payment | delivery | product_quality | customer_support",
          "summaryInOneSentence": "A concise English summary"
        }
      \\\`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonResponse = JSON.parse(response.text || '{}');
    res.json({ success: true, analysis: jsonResponse });
  } catch (error) {
    console.error('Error processing multilingual telemetry:', error);
    res.status(500).json({ error: 'Failed to process feedback telemetry' });
  }
});

app.listen(3000, () => {
  console.log('Local AI Feedback analyzer running on port 3000');
});
\`\`\`

This basic template demonstrates how developers can integrate multilingual telemetry analysis directly into enterprise customer-support backends with minimal operational complexity.

---

### Conclusion: The Road Ahead

The AI evolution in India is characterized by a shift from software consumption to architectural creation. By harnessing its colossal, diverse data pools, scaling up sovereign hardware clusters under the IndiaAI Mission, and building models tailored for localized language processing and low-compute client devices, India is creating a unique, public-goods-centric blueprint for AI scaling.

As distributed systems, mobile-edge computing, and Indic foundational LLMs continue to mature, the nation is positioned not just to participate in the global AI landscape, but to redefine how scalable, highly localized, and socially impactful artificial intelligence is deployed at a population level.
`
};

export const SAMPLE_AI_WORLD_BLOG = {
  title: "The Global AI Paradigm: Hardware Scaling, Foundational Models, and the Edge Frontier",
  content: `The global artificial intelligence landscape is undergoing an unprecedented architectural consolidation. What began as a series of isolated breakthroughs in deep convolutional networks and natural language understanding has converged into a singular, compute-intensive paradigm dominated by Transformer-based architectures, dense parameter scaling, and specialized silicon acceleration. 

As we progress through this technological era, the vectors of innovation are shifting. The initial race for raw parameter volume is giving way to a multi-dimensional optimization challenge involving high-bandwidth memory (HBM) yields, distributed power grids, open-weights efficiency, and edge-inferencing hardware.

---

### 1. The Compute Supercluster & Silicon Bottlenecks

At the core of the global AI expansion is an insatiable demand for floating-point operations per second (FLOPS). Training modern frontier models with tens of trillions of tokens requires massive parallelization across tens of thousands of specialized tensor-processing units (TPUs) or GPUs.

#### A. Memory Bandwidth: The True Bottleneck
While raw tensor core compute capacity has scaled exponentially, memory transfer speeds between processing units and RAM have lagged behind. This memory bandwidth bottleneck has made High-Bandwidth Memory (HBM3e and HBM4) the most critical commodity in high-performance computing. Without sufficient memory bus width, powerful GPUs spend idle clock cycles waiting for model weights to load during forward and backward passes.

#### B. The Global Grid and Energy Limits
A single modern training cluster can consume upwards of 100 megawatts of electricity—comparable to the energy needs of a medium-sized city. The global deployment of AI training is therefore increasingly constrained by power grid capacity. Hyperscalers are forced to select data center locations not based on proximity to fiber optic hubs, but on access to stable, dedicated nuclear, hydroelectric, or geothermal power sources.

---

### 2. The Battle of Architectures: Closed APIs vs. Open Weights

The strategic direction of global software engineering is being shaped by two competing philosophies of model distribution:

| Metric | Closed-Source APIs (e.g., Claude 3.5, GPT-4o) | Open-Weights Ecosystem (e.g., LLaMA-3, Mistral) |
| :--- | :--- | :--- |
| **Privacy & Security** | Data processed on third-party servers; risk of vendor leakage. | Zero-egress local hosting; full ownership over data pipelines. |
| **Fine-Tuning Control** | Restricted to high-level APIs or adapter uploads. | Direct access to attention matrices, low-rank adapters (LoRAs), and weights. |
| **Operational Cost** | High-variable API billing; dependent on query volume. | Predictable capital expenditure on dedicated GPU clusters. |
| **Adaptability** | Homogenized global output; safe but generic. | Custom domain adaptations for highly specialized clinical or legal use-cases. |

The open-weights movement has proven that smaller, hyper-optimized models (e.g., 8B to 70B parameters) can achieve parity with massive proprietary systems when trained on high-quality synthetic data, demonstrating that architectural design and data curation are often superior to brute-force parameter scaling.

---

### 3. Edge AI: Decentralizing Inference

Cloud-hosted inference introduces significant network latency, expensive API overhead, and single-point-of-failure risks. To build highly responsive user interfaces, developers are shifting workloads directly to client-side devices.

Recent advancements in **4-bit GPTQ/AWQ quantization** and dedicated Neural Processing Units (NPUs) built into consumer chipsets allow mobile devices and laptops to execute 7B-parameter models locally at over 45 tokens per second. This shift enables real-time voice translation, offline document analysis, and autonomous robotics with zero network footprint.

---

### 4. Architectural Blueprint: Globally Distributed AI Proxy

To illustrate how global enterprises manage multi-model fallbacks, load-balancing, and caching across geographical regions, consider this production-grade TypeScript proxy structure. It intercepts user queries, queries a local Redis cache to avoid redundant GPU execution, and distributes calls dynamically between fast local models and deep cloud models:

\`\`\`typescript
// globalAiProxy.ts
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { createClient } from 'redis';

const app = express();
app.use(express.json());

// Initialize Redis for global semantic caching
const cache = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
cache.on('error', (err) => console.error('Redis Cache Error', err));
await cache.connect();

// Initialize the primary generative model client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/v1/query', async (req, res) => {
  const { prompt, streamResponse = false } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Step 1: Query cache to eliminate redundant execution costs
    const cachedResult = await cache.get(prompt);
    if (cachedResult) {
      return res.json({ source: 'semantic_cache', response: JSON.parse(cachedResult) });
    }

    // Step 2: Fallback to fast, low-cost model for standard queries
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2
      }
    });

    const outputText = response.text || '';
    
    // Step 3: Hydrate cache with response (TTL of 1 hour)
    await cache.setEx(prompt, 3600, JSON.stringify(outputText));

    res.json({ source: 'gpu_inference_cluster', response: outputText });
  } catch (error) {
    console.error('Inference pipeline execution failed:', error);
    res.status(500).json({ error: 'Global inference cluster experienced a partial outage' });
  }
});

app.listen(3000, () => {
  console.log('Global AI Edge-Proxy running on port 3000');
});
\`\`\`

---

### Conclusion: The Frontier Ahead

The future of global artificial intelligence will not be defined solely by the scale of our supercomputers, but by our ability to make intelligent systems efficient, accessible, and integrated into daily life. As we venture beyond standard transformer limits, breakthrough structures like Liquid Neural Networks, State-Space Models (SSMs), and fully autonomous agent swarms will redefine the boundaries of human-machine collaboration.
`
};

export const SAMPLE_ELECTIONS_INDIA_BLOG = {
  title: "The Architecture of Democracy: Technology, Security, and Scale in India's Election System",
  content: `Conducting a general election in the world's most populous country is a feat of unmatched logistical, technological, and bureaucratic scale. With over 960 million registered voters, more than 1 million polling stations, and 15 million polling officials, the Election Commission of India (ECI) coordinates a system that must operate with absolute precision and uncompromised integrity.

At the heart of this colossal operation is a collection of custom-engineered hardware and strict offline security protocols designed to eliminate the vulnerabilities inherent in modern networked computing.

---

### 1. Hardware-Level Security: The Indian EVM Design

Unlike election systems in many western countries that utilize networked optical scanners or touch-screen voting terminals connected to central servers, India's Electronic Voting Machines (EVMs) are completely offline, decentralized, and air-gapped.

#### A. Microcontroller and OTP ROM
An Indian EVM consists of a **Control Unit** and a **Ballot Unit** connected via a secure, hardwired cable. The core firmware is permanently burnt into a One-Time Programmable (OTP) Read-Only Memory chip during manufacturing. This means:
- The code cannot be modified, flashed, or upgraded once the chip is sealed.
- The machine does not have an operating system, communication ports (no USB, serial, or parallel jacks), or network adaptors (no Wi-Fi, Bluetooth, or cellular antennas).
- The air-gapped design makes remote hacking, network intercept attacks, or software injections physically impossible.

#### B. Dual-Unit Verification with VVPAT
To reinforce public confidence and provide physical audits, the ECI introduced the **Voter Verifiable Paper Audit Trail (VVPAT)**. When a voter presses a button on the Ballot Unit:
1. The VVPAT printer receives an encrypted command from the Control Unit.
2. It prints a physical slip containing the candidate's serial number, name, and symbol.
3. The voter sees this slip through a transparent glass window for 7 seconds.
4. The slip automatically cuts and falls into a secure, sealed collection box.
5. This physical paper trail serves as the definitive legal audit source during count verification and manual recounts.

---

### 2. Operational Rigor: Custody, Auditing, and Zero-Trust

Hardware isolation is only half the battle. ECI maintains a strict **Zero-Trust custody chain** to prevent physical tampering:

1. **Two-Stage Randomization**: No official knows which machine will be deployed to which constituency. EVMs are randomized twice using specialized software in the presence of political party representatives before being allocated to individual polling booths.
2. **Mock Polls & Multi-Party Seals**: On election day, at 5:30 AM, presiding officers conduct mock polls with at least 50 test votes in front of polling agents from all competing parties. Once verified, the Control Unit is sealed using physical, uniquely numbered paper seals signed by all agents. Any attempt to open the compartment will tear the signature seal, instantly invalidating the machine.
3. **Continuous Secure Storage**: After voting ends, the EVMs are powered down, placed in secure carrying cases, sealed, and escorted under armed guard to highly fortified "Strong Rooms" protected by double-lock doors, round-the-clock CCTV, and active security forces.

---

### 3. Data Integration: Aggregation, Auditing, and Telemetry

While the vote casting and printing remain offline, the process of aggregating results across 543 parliamentary seats is supported by secure, high-integrity administrative systems.

Once the physical seal verification is complete on counting day, officials enter the recorded totals from each machine's display into the central, secured ENCORE portal. ECI implements automated validation checks to guarantee that no constituency reports more votes than the actual registered voter counts recorded during the polling phase.

#### Architectural Mock-up: Automated Verification and Audit Pipeline
To understand how an enterprise election telemetry system validates constituency-level voting data to prevent clerical entry errors, consider this secure Node.js validation class:

\`\`\`typescript
// electionAuditor.ts

interface ConstituencyVoteReport {
  constituencyId: string;
  totalRegisteredVoters: number;
  evmRecordedVotes: number;
  vvpatPaperAuditVotes: number;
  provisionalTenderedVotes: number;
}

class ElectionDataIntegrityAuditor {
  /**
   * Validates constituency voting report for mathematical and logical inconsistencies.
   * Throws detailed errors if any potential discrepancy is flagged.
   */
  public auditConstituencyReport(report: ConstituencyVoteReport): { isValid: boolean; status: string } {
    const { totalRegisteredVoters, evmRecordedVotes, vvpatPaperAuditVotes, provisionalTenderedVotes } = report;

    // Rule 1: Absolute Cap Validation
    const totalCastVotes = evmRecordedVotes + provisionalTenderedVotes;
    if (totalCastVotes > totalRegisteredVoters) {
      throw new Error(\`CRITICAL INTEGRITY FAILURE: Total votes cast (\${totalCastVotes}) exceeds registered voter capacity (\&{totalRegisteredVoters}) in constituency \${report.constituencyId}\`);
    }

    // Rule 2: Physical Paper Trail Match
    const discrepancyThreshold = 0; // Absolute zero discrepancy allowed
    const paperDiscrepancy = Math.abs(evmRecordedVotes - vvpatPaperAuditVotes);
    if (paperDiscrepancy > discrepancyThreshold) {
      throw new Error(\`AUDIT DISCREPANCY DETECTED: Electronic votes (\${evmRecordedVotes}) and physical paper slips (\${vvpatPaperAuditVotes}) do not match in constituency \${report.constituencyId}!\`);
    }

    // Rule 3: Anomalous Turnout Turnbacks
    const turnoutPercentage = (totalCastVotes / totalRegisteredVoters) * 100;
    if (turnoutPercentage > 100 || turnoutPercentage < 0) {
      throw new Error(\`LOGICAL ANOMALY: Invalid turnout percentage calculation (\${turnoutPercentage.toFixed(2)}%)\`);
    }

    return {
      isValid: true,
      status: \`Constituency \${report.constituencyId} verified successfully. Turnout: \${turnoutPercentage.toFixed(2)}%\`
    };
  }
}

// Example Execution
const auditor = new ElectionDataIntegrityAuditor();
try {
  const result = auditor.auditConstituencyReport({
    constituencyId: "IN-UP-01",
    totalRegisteredVoters: 1850000,
    evmRecordedVotes: 1245600,
    vvpatPaperAuditVotes: 1245600,
    provisionalTenderedVotes: 12
  });
  console.log(result.status);
} catch (error: any) {
  console.error("ALERT:", error.message);
}
\`\`\`

---

### Conclusion: Trust as a Technology

India's election system demonstrates a profound truth: in high-stakes governance, the most robust technology is not necessarily the most connected. By combining custom-designed, air-gapped microcontrollers with rigorous public multi-party observation and physical paper audits, India has successfully scaled democracy to a near-billion citizens, proving that secure systems are built on layers of physical trust, simple architectures, and verifiable paper trails.
`
};



