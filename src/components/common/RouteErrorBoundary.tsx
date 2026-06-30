import { Component, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface State { error: Error | null }

export class RouteErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error) { console.error("[route]", error); }
  reset = () => this.setState({ error: null });
  render() {
    if (this.state.error) {
      return (
        <div className="p-6">
          <Card className="p-6 max-w-xl mx-auto border-lnx-amber-500/30 bg-lnx-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-lnx-amber-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-lnx-navy-800">This screen hit an error</h3>
                <p className="mt-1 text-sm text-muted-foreground">The rest of the app is unaffected. You can retry this page.</p>
                <p className="mt-2 text-[11px] font-mono text-muted-foreground break-all">{this.state.error.message}</p>
                <Button onClick={this.reset} size="sm" className="mt-3"><RefreshCcw className="h-3 w-3 mr-2" />Retry</Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
