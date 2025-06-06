enum Roles {
  "user",
  "admin",
}

enum HTTP_METHOD {
  POST = "POST",
  GET = "GET",
}

enum HTTP_STATUS {
  OK = 200,
  INTERNAL_SERVER_ERROR = 500,
}

type RequestMock = {
  method: string;
  host: string;
  path: string;
  body?: object;
  params: Record<string, unknown>;
};

type ObserverHandlers<T> = {
  next: (value: T) => void;
  error: (error: Error) => void;
  complete: () => void;
};

type UserMock = {
  name: string;
  age: number;
  roles: Roles[];
  createdAt: Date;
  isDeleted: boolean;
};

class Observer<T> {
  private handlers: ObserverHandlers<T>;
  private isUnsubscribed: boolean;
  public _unsubscribe: () => void = () => {};

  constructor(handlers: ObserverHandlers<T>) {
    this.handlers = handlers;
    this.isUnsubscribed = false;
  }

  next(value: T) {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }

  error(error: Error) {
    if (!this.isUnsubscribed) {
      if (this.handlers.error) {
        this.handlers.error(error);
      }

      this.unsubscribe();
    }
  }

  complete() {
    if (!this.isUnsubscribed) {
      if (this.handlers.complete) {
        this.handlers.complete();
      }

      this.unsubscribe();
    }
  }

  unsubscribe() {
    this.isUnsubscribed = true;

    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}

class Observable<T> {
  protected _subscribe: (Observer: Observer<T>) => () => void;
  constructor(subscribe: (Observer: Observer<T>) => () => void) {
    this._subscribe = subscribe;
  }

  static from<T>(values: T[]) {
    return new Observable<T>((observer) => {
      values.forEach((value) => observer.next(value));

      observer.complete();

      return () => {
        console.log("unsubscribed");
      };
    });
  }

  subscribe(obs: ObserverHandlers<T>) {
    const observer = new Observer<T>(obs);

    observer._unsubscribe = this._subscribe(observer);

    return {
      unsubscribe() {
        observer.unsubscribe();
      },
    };
  }
}

const userMock: UserMock = {
  name: "User Name",
  age: 26,
  roles: [Roles.user, Roles.admin],
  createdAt: new Date(),
  isDeleted: false,
};

const requestsMock: RequestMock[] = [
  {
    method: HTTP_METHOD.POST,
    host: "service.example",
    path: "user",
    body: userMock,
    params: {},
  },
  {
    method: HTTP_METHOD.GET,
    host: "service.example",
    path: "user",
    params: {
      id: "3f5h67s4s",
    },
  },
];

const handleRequest = (request: RequestMock) => {
  // handling of request
  console.log(request);
  return { status: HTTP_STATUS.OK };
};

const handleError = (error: Error) => {
  // handling of error
  console.error(error);
  return { status: HTTP_STATUS.INTERNAL_SERVER_ERROR };
};

const handleComplete = () => console.log("complete");

const requests$: Observable<RequestMock> = Observable.from<RequestMock>(requestsMock);

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete,
});

subscription.unsubscribe();
