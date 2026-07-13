import { KeyPairError } from "@/crypt";
import { ref } from "vue";

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return `${error.name}: ${error.message}`;
    }
    throw error;
}

export function useWithErrors() {
    const error = ref<string | null>(null)
    async function withKeyPairError<T>(
        fn: () => Promise<T>, onErr?: (err: any) => void, onFinally?: () => void
      ): Promise<T> {
        try {
          error.value = null;
          return await fn();
        } catch (err) {
          if (err instanceof KeyPairError) {
            error.value = getErrorMessage(err);
            if (onErr) onErr(err);
          }
          throw err;
        } finally { if (onFinally) onFinally() }
  }
  return {error,withKeyPairError}
}