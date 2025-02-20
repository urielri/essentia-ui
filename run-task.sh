#!/bin/bash

TASK="$1"
PACKAGE="$2"

if [ -n "$TASK" ]; then
  echo "Tarea a ejecutar: $TASK"
else
  echo "Se debe especificar la tarea a ejecutar"
  exit 1
fi

if [ -n "$PACKAGE" ]; then
  echo "Corriendo tarea $TASK en el paquete $PACKAGE"
  exec turbo "$TASK":"$PACKAGE"
else
  exec turbo "$TASK"
  exit 0
fi
exit 0
