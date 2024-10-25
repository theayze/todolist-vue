<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ref, onMounted } from "vue";
import PocketBase from "pocketbase";

// Date formatter for the calendar
import {
  DateFormatter,
  type DateValue,
  getLocalTimeZone,
} from "@internationalized/date";
import { Calendar as CalendarIcon } from "lucide-vue-next";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";

// Initialize date formatter and value
const df = new DateFormatter("en-US", {
  dateStyle: "long",
});
const value = ref<DateValue>();

// PocketBase initialization
const pb = ref(null);
const currentUser = ref(null);
const username = ref("");
const password = ref("");

// Reactive state for fetched data
const records = ref([]);

// Reactive state for the form inputs
const newTask = ref(""); // Task name
const newDate = ref(""); // Date with time

// Fetch data from PocketBase collection
async function fetchData() {
  try {
    const fetchedRecords = await pb.value.collection("todolist").getFullList({
      sort: "-created",
    });
    records.value = fetchedRecords;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Handle login
const doLogin = async () => {
  try {
    const authData = await pb.value
      .collection("users")
      .authWithPassword(username.value, password.value);

    currentUser.value = pb.value.authStore.model;

    // Fetch data after successful login
    await fetchData();
  } catch (error) {
    console.error("Login error:", error);
  }
};

// Handle logout
const doLogout = () => {
  pb.value.authStore.clear();
  currentUser.value = null;
  records.value = []; // Clear records after logout
};

// Initialize PocketBase on mount
onMounted(() => {
  pb.value = new PocketBase("http://127.0.0.1:8090");
});

// Add a new task to PocketBase
async function addTask() {
  if (!newTask.value || !value.value) {
    // Check value instead of newDate
    console.error("Task name and date are required.");
    return;
  }

  try {
    // Get the date from the Calendar component
    const selectedDate = value.value.toDate(getLocalTimeZone());

    // Format the date for PocketBase
    const formattedDate = selectedDate.toISOString();

    const newRecord = await pb.value.collection("todolist").create({
      task: newTask.value,
      date: formattedDate,
    });

    // Clear form inputs
    newTask.value = "";
    value.value = null; // Reset the calendar value

    await fetchData();
  } catch (error) {
    console.error("Error adding task:", error);
  }
}

async function deleteTask(taskId) {
  try {
    // Confirm before deletion
    const confirmed = confirm("Are you sure you want to delete this task?");
    if (!confirmed) return;

    // Use pb.value instead of pb
    await pb.value.collection("todolist").delete(taskId);

    // Refresh the task list after deletion
    await fetchData();

    console.log(`Task with ID ${taskId} has been deleted.`);
  } catch (error) {
    console.error("Error deleting task:", error);
  }
}
</script>

<template>
  <div class="container mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">
      To-Do-List by {{ currentUser?.name }}
    </h1>
    <div v-if="currentUser">
      <div>
        <Button type="button" @click="doLogout">Sign Out</Button>
      </div>

      <!-- Logged In form & table -->
      <Card class="w-[350px] mt-5">
        <CardHeader>
          <CardTitle>Task</CardTitle>
          <CardDescription>Enter your task.</CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="addTask">
            <!-- Form submit handler -->
            <div class="grid items-center w-full gap-4">
              <div class="flex flex-col space-y-1.5">
                <Label for="name">Task</Label>
                <Input
                  id="name"
                  v-model="newTask"
                  placeholder="Name of your task"
                />
              </div>
              <div class="flex flex-col space-y-1.5">
                <Label for="framework">Due Date</Label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      :class="
                        cn(
                          'w-[280px] justify-start text-left font-normal',
                          !value && 'text-muted-foreground'
                        )
                      "
                    >
                      <CalendarIcon class="mr-2 h-4 w-4" />
                      {{
                        value
                          ? df.format(value.toDate(getLocalTimeZone()))
                          : "Pick a date"
                      }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0">
                    <Calendar
                      v-model="value"
                      @change="newDate.value = value.toDate(getLocalTimeZone())"
                      initial-focus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter class="flex justify-between px-6 pb-6">
          <Button
            variant="outline"
            @click="
              newTask = '';
              newDate = '';
            "
            >Cancel</Button
          >
          <Button @click="addTask">Enter</Button>
          <!-- Add task button -->
        </CardFooter>
      </Card>

      <!-- Table displaying tasks -->
      <Table class="mt-5">
        <TableCaption>A list of your recent tasks.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[100px]"></TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="(record, index) in records" :key="index">
            <TableCell class="font-medium"> <Checkbox id="terms" /> </TableCell>
            <TableCell>{{ record.task }}</TableCell>
            <TableCell>{{ record.date }}</TableCell>
            <TableCell
              ><Button variant="destructive" @click="deleteTask(record.id)">
                Delete
              </Button></TableCell
            >
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- If not logged in, display login form -->
    <div v-else>
      <div class="grid w-full max-w-sm items-center gap-1.5 mt-4">
        <Label for="username">Email</Label>
        <Input
          v-model="username"
          id="username"
          type="email"
          placeholder="Email"
        />
      </div>
      <div class="grid w-full max-w-sm items-center gap-1.5 mt-4">
        <Label for="password">Password</Label>
        <Input
          v-model="password"
          id="password"
          type="password"
          placeholder="Password"
        />
      </div>
      <div class="mt-4">
        <Button type="button" @click="doLogin">Sign In</Button>
      </div>
    </div>
  </div>
</template>
