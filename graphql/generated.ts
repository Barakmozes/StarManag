import gql from 'graphql-tag';
import * as Urql from 'urql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type Area = {
  __typename?: 'Area';
  children: Array<Area>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  floorPlanImage?: Maybe<Scalars['String']['output']>;
  gridConfig?: Maybe<GridConfig>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  parent?: Maybe<Area>;
  parentId?: Maybe<Scalars['String']['output']>;
  restaurant: Restaurant;
  restaurantId?: Maybe<Scalars['String']['output']>;
  tables: Array<Table>;
  updatedAt: Scalars['DateTime']['output'];
  waitlists: Array<Waitlist>;
};

export type AreaAvailability = {
  __typename?: 'AreaAvailability';
  availableTables: Scalars['Int']['output'];
  description?: Maybe<Scalars['String']['output']>;
  floorPlanImage?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  totalTables: Scalars['Int']['output'];
};

export type AreaOrderByInput = {
  createdAt?: InputMaybe<SortOrder>;
};

export type AttendanceSummary = {
  __typename?: 'AttendanceSummary';
  attendanceRate: Scalars['Float']['output'];
  avgHoursPerShift: Scalars['Float']['output'];
  lateCount: Scalars['Int']['output'];
  missedCount: Scalars['Int']['output'];
  overtimeHours: Scalars['Float']['output'];
  shiftCount: Scalars['Int']['output'];
  totalHours: Scalars['Float']['output'];
};

export type BasicArea = {
  __typename?: 'BasicArea';
  createdAt: Scalars['DateTime']['output'];
  floorPlanImage?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Category = {
  __typename?: 'Category';
  desc: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  img: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type DashboardKpis = {
  __typename?: 'DashboardKpis';
  avgOrderValue: Scalars['Float']['output'];
  canceledOrders: Scalars['Int']['output'];
  categoriesCount: Scalars['Int']['output'];
  completedOrders: Scalars['Int']['output'];
  grossRevenue: Scalars['Float']['output'];
  menusCount: Scalars['Int']['output'];
  newCustomers: Scalars['Int']['output'];
  ordersCount: Scalars['Int']['output'];
  tablesCount: Scalars['Int']['output'];
  uniqueCustomers: Scalars['Int']['output'];
  usersCount: Scalars['Int']['output'];
};

export type DashboardKpisCompare = {
  __typename?: 'DashboardKpisCompare';
  current: DashboardKpis;
  currentFrom: Scalars['DateTime']['output'];
  currentTo: Scalars['DateTime']['output'];
  previous: DashboardKpis;
  previousFrom: Scalars['DateTime']['output'];
  previousTo: Scalars['DateTime']['output'];
};

export type DashboardRevenueCompare = {
  __typename?: 'DashboardRevenueCompare';
  currentFrom: Scalars['DateTime']['output'];
  currentTo: Scalars['DateTime']['output'];
  points: Array<DashboardRevenueComparePoint>;
  previousFrom: Scalars['DateTime']['output'];
  previousTo: Scalars['DateTime']['output'];
};

export type DashboardRevenueComparePoint = {
  __typename?: 'DashboardRevenueComparePoint';
  bucket: Scalars['DateTime']['output'];
  orders: Scalars['Int']['output'];
  previousBucket?: Maybe<Scalars['DateTime']['output']>;
  previousOrders: Scalars['Int']['output'];
  previousRevenue: Scalars['Float']['output'];
  revenue: Scalars['Float']['output'];
};

export type DashboardRevenuePoint = {
  __typename?: 'DashboardRevenuePoint';
  bucket: Scalars['DateTime']['output'];
  orders: Scalars['Int']['output'];
  revenue: Scalars['Float']['output'];
};

export type Delivery = {
  __typename?: 'Delivery';
  createdAt: Scalars['DateTime']['output'];
  driverEmail: Scalars['String']['output'];
  driverName: Scalars['String']['output'];
  driverPhone: Scalars['String']['output'];
  id: Scalars['String']['output'];
  order: Order;
  orderNum: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type EmployeeDashboardKpis = {
  __typename?: 'EmployeeDashboardKpis';
  activeClockIns: Scalars['Int']['output'];
  avgHoursPerEmployee: Scalars['Float']['output'];
  cancelledShifts: Scalars['Int']['output'];
  publishedShifts: Scalars['Int']['output'];
  staffCount: Scalars['Int']['output'];
  totalHoursWorked: Scalars['Float']['output'];
  totalShifts: Scalars['Int']['output'];
  uniqueEmployeesWorked: Scalars['Int']['output'];
};

export type Favorite = {
  __typename?: 'Favorite';
  id: Scalars['String']['output'];
  menu: Array<Scalars['String']['output']>;
  user: User;
  userEmail: Scalars['String']['output'];
};

export type GridConfig = {
  __typename?: 'GridConfig';
  area: Area;
  areaId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  gridSize: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Menu = {
  __typename?: 'Menu';
  category: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  image: Scalars['String']['output'];
  longDescr?: Maybe<Scalars['String']['output']>;
  onPromo: Scalars['Boolean']['output'];
  prepType: Array<Scalars['String']['output']>;
  price: Scalars['Float']['output'];
  sellingPrice?: Maybe<Scalars['Float']['output']>;
  shortDescr: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addArea: Area;
  addCategory: Category;
  addFavorite: Favorite;
  addGridConfig: GridConfig;
  addGuestReservation: Reservation;
  addMenu: Menu;
  addNotification: Notification;
  addOrder: Order;
  addOrderToTable: Order;
  addProfile: Profile;
  addReservation: Reservation;
  addRestaurant: Restaurant;
  addTable: Table;
  addTableUsage: TableUsage;
  addWaitlistEntry: Waitlist;
  assignDriverToOrder: Delivery;
  callWaitlistEntry: Waitlist;
  cancelReservation: Reservation;
  cancelShift: Shift;
  cancelWaitlistEntry: Waitlist;
  clockIn: TimeEntry;
  clockOut: TimeEntry;
  completeReservation: Reservation;
  createShift: Shift;
  createShiftTemplate: ShiftTemplate;
  deleteArea: Area;
  deleteCategory: Category;
  deleteGridConfig: GridConfig;
  deleteMenu: Menu;
  deleteNotification: Notification;
  deleteRestaurant: Restaurant;
  deleteShiftTemplate: ShiftTemplate;
  deleteTable: Table;
  deleteTableUsage: TableUsage;
  deleteTimeEntry: TimeEntry;
  deleteUser: User;
  editArea: Area;
  editCategory: Category;
  editGridConfig: GridConfig;
  editMenu: Menu;
  editOrder: Order;
  editOrderOnPayment: Order;
  editProfile: Profile;
  editReservation: Reservation;
  editRestaurant: Restaurant;
  editShift: Shift;
  editShiftTemplate: ShiftTemplate;
  editTable: Table;
  editTimeEntry: TimeEntry;
  editUserRole: User;
  /** Generate Shift records for a week from a template. Returns count of shifts created. */
  generateShiftsFromTemplate: Scalars['Int']['output'];
  incrementUsageCount: TableUsage;
  markAllNotificationsAsRead: Scalars['Int']['output'];
  markDeliveryDelivered: Order;
  markDeliveryReady: Order;
  markNotificationAsRead: Notification;
  movePositionTable: Table;
  publishShifts: Scalars['Int']['output'];
  removeDriverFromOrder: Scalars['Boolean']['output'];
  removeFavorite: Favorite;
  removeWaitlistEntry: Waitlist;
  seatWaitlistEntry: Waitlist;
  toggleShiftTemplateActive: ShiftTemplate;
  toggleTableReservation: Table;
  updateManyTables: Array<Table>;
  updateNotification: Notification;
  updateTableUsage: TableUsage;
  updateUserProfile: User;
  updateWaitlistEntry: Waitlist;
};


export type MutationAddAreaArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  floorPlanImage?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['String']['input']>;
  restaurantId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationAddCategoryArgs = {
  desc: Scalars['String']['input'];
  img: Scalars['String']['input'];
  title: Scalars['String']['input'];
};


export type MutationAddFavoriteArgs = {
  menuId: Scalars['String']['input'];
  userEmail: Scalars['String']['input'];
};


export type MutationAddGridConfigArgs = {
  areaId: Scalars['String']['input'];
  gridSize?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationAddGuestReservationArgs = {
  createdBy: Role;
  customerName: Scalars['String']['input'];
  numOfDiners: Scalars['Int']['input'];
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  reservationTime: Scalars['DateTime']['input'];
  tableId: Scalars['String']['input'];
};


export type MutationAddMenuArgs = {
  category: Scalars['String']['input'];
  image: Scalars['String']['input'];
  longDescr: Scalars['String']['input'];
  onPromo: Scalars['Boolean']['input'];
  prepType: Array<Scalars['String']['input']>;
  price: Scalars['Float']['input'];
  sellingPrice?: InputMaybe<Scalars['Float']['input']>;
  shortDescr: Scalars['String']['input'];
  title: Scalars['String']['input'];
};


export type MutationAddNotificationArgs = {
  message: Scalars['String']['input'];
  priority?: InputMaybe<NotificationPriority>;
  status?: InputMaybe<NotificationStatus>;
  type: Scalars['String']['input'];
  userEmail: Scalars['String']['input'];
};


export type MutationAddOrderArgs = {
  cart: Scalars['JSON']['input'];
  deliveryAddress: Scalars['String']['input'];
  deliveryFee: Scalars['Float']['input'];
  discount?: InputMaybe<Scalars['Float']['input']>;
  items?: InputMaybe<Scalars['JSON']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
  orderNumber: Scalars['String']['input'];
  paymentToken?: InputMaybe<Scalars['String']['input']>;
  pickupTime?: InputMaybe<Scalars['DateTime']['input']>;
  preOrder?: InputMaybe<Scalars['Boolean']['input']>;
  serviceFee: Scalars['Float']['input'];
  specialNotes?: InputMaybe<Scalars['String']['input']>;
  tableId?: InputMaybe<Scalars['String']['input']>;
  total: Scalars['Float']['input'];
  userEmail: Scalars['String']['input'];
  userName: Scalars['String']['input'];
  userPhone: Scalars['String']['input'];
};


export type MutationAddOrderToTableArgs = {
  cart: Scalars['JSON']['input'];
  discount?: InputMaybe<Scalars['Float']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
  orderNumber: Scalars['String']['input'];
  paymentToken?: InputMaybe<Scalars['String']['input']>;
  serviceFee: Scalars['Float']['input'];
  tableId: Scalars['String']['input'];
  total: Scalars['Float']['input'];
  userEmail: Scalars['String']['input'];
  userName: Scalars['String']['input'];
};


export type MutationAddProfileArgs = {
  email: Scalars['String']['input'];
  img?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};


export type MutationAddReservationArgs = {
  createdBy: Role;
  createdByUserEmail?: InputMaybe<Scalars['String']['input']>;
  numOfDiners: Scalars['Int']['input'];
  reservationTime: Scalars['DateTime']['input'];
  tableId: Scalars['String']['input'];
  userEmail: Scalars['String']['input'];
};


export type MutationAddRestaurantArgs = {
  address?: InputMaybe<Scalars['String']['input']>;
  bannerImg?: InputMaybe<Scalars['String']['input']>;
  deliveryFee?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
  openTimes?: InputMaybe<Scalars['JSON']['input']>;
  rating?: InputMaybe<Scalars['Float']['input']>;
  serviceFee?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationAddTableArgs = {
  areaId: Scalars['String']['input'];
  diners: Scalars['Int']['input'];
  position?: InputMaybe<Scalars['JSON']['input']>;
  reserved?: InputMaybe<Scalars['Boolean']['input']>;
  specialRequests?: InputMaybe<Array<Scalars['String']['input']>>;
  tableNumber: Scalars['Int']['input'];
};


export type MutationAddTableUsageArgs = {
  lastUsed?: InputMaybe<Scalars['DateTime']['input']>;
  tableId: Scalars['String']['input'];
  usageCount?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationAddWaitlistEntryArgs = {
  areaId: Scalars['String']['input'];
  numOfDiners: Scalars['Int']['input'];
  priority?: InputMaybe<Scalars['Int']['input']>;
  userEmail: Scalars['String']['input'];
};


export type MutationAssignDriverToOrderArgs = {
  driverEmail: Scalars['String']['input'];
  driverName: Scalars['String']['input'];
  driverPhone: Scalars['String']['input'];
  orderNumber: Scalars['String']['input'];
};


export type MutationCallWaitlistEntryArgs = {
  id: Scalars['String']['input'];
};


export type MutationCancelReservationArgs = {
  id: Scalars['String']['input'];
};


export type MutationCancelShiftArgs = {
  id: Scalars['String']['input'];
};


export type MutationCancelWaitlistEntryArgs = {
  id: Scalars['String']['input'];
};


export type MutationClockInArgs = {
  note?: InputMaybe<Scalars['String']['input']>;
};


export type MutationClockOutArgs = {
  note?: InputMaybe<Scalars['String']['input']>;
  timeEntryId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCompleteReservationArgs = {
  id: Scalars['String']['input'];
};


export type MutationCreateShiftArgs = {
  areaId?: InputMaybe<Scalars['String']['input']>;
  endTime: Scalars['DateTime']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  shiftRole?: InputMaybe<Role>;
  startTime: Scalars['DateTime']['input'];
  userEmail: Scalars['String']['input'];
};


export type MutationCreateShiftTemplateArgs = {
  areaId?: InputMaybe<Scalars['String']['input']>;
  dayOfWeek: Scalars['Int']['input'];
  defaultRole?: InputMaybe<Role>;
  description?: InputMaybe<Scalars['String']['input']>;
  endTime: Scalars['String']['input'];
  name: Scalars['String']['input'];
  startTime: Scalars['String']['input'];
};


export type MutationDeleteAreaArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteCategoryArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteGridConfigArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteMenuArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteNotificationArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteRestaurantArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteShiftTemplateArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteTableArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteTableUsageArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteTimeEntryArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteUserArgs = {
  id: Scalars['String']['input'];
};


export type MutationEditAreaArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  floorPlanImage?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  parentId?: InputMaybe<Scalars['String']['input']>;
  restaurantId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationEditCategoryArgs = {
  desc: Scalars['String']['input'];
  id: Scalars['String']['input'];
  img: Scalars['String']['input'];
  title: Scalars['String']['input'];
};


export type MutationEditGridConfigArgs = {
  gridSize?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['String']['input'];
};


export type MutationEditMenuArgs = {
  category: Scalars['String']['input'];
  id: Scalars['String']['input'];
  image: Scalars['String']['input'];
  longDescr: Scalars['String']['input'];
  onPromo: Scalars['Boolean']['input'];
  prepType: Array<Scalars['String']['input']>;
  price: Scalars['Float']['input'];
  sellingPrice?: InputMaybe<Scalars['Float']['input']>;
  shortDescr: Scalars['String']['input'];
  title: Scalars['String']['input'];
};


export type MutationEditOrderArgs = {
  deliveryTime?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['String']['input'];
  status: OrderStatus;
};


export type MutationEditOrderOnPaymentArgs = {
  id: Scalars['String']['input'];
  paymentToken?: InputMaybe<Scalars['String']['input']>;
};


export type MutationEditProfileArgs = {
  email: Scalars['String']['input'];
  img?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};


export type MutationEditReservationArgs = {
  id: Scalars['String']['input'];
  numOfDiners?: InputMaybe<Scalars['Int']['input']>;
  reservationTime?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<ReservationStatus>;
};


export type MutationEditRestaurantArgs = {
  address?: InputMaybe<Scalars['String']['input']>;
  bannerImg?: InputMaybe<Scalars['String']['input']>;
  deliveryFee?: InputMaybe<Scalars['Float']['input']>;
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  openTimes?: InputMaybe<Scalars['JSON']['input']>;
  rating?: InputMaybe<Scalars['Float']['input']>;
  serviceFee?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationEditShiftArgs = {
  areaId?: InputMaybe<Scalars['String']['input']>;
  endTime?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['String']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  shiftRole?: InputMaybe<Role>;
  startTime?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<ShiftStatus>;
};


export type MutationEditShiftTemplateArgs = {
  areaId?: InputMaybe<Scalars['String']['input']>;
  dayOfWeek?: InputMaybe<Scalars['Int']['input']>;
  defaultRole?: InputMaybe<Role>;
  description?: InputMaybe<Scalars['String']['input']>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  startTime?: InputMaybe<Scalars['String']['input']>;
};


export type MutationEditTableArgs = {
  areaId?: InputMaybe<Scalars['String']['input']>;
  diners?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['String']['input'];
  position?: InputMaybe<Scalars['JSON']['input']>;
  reserved?: InputMaybe<Scalars['Boolean']['input']>;
  specialRequests?: InputMaybe<Array<Scalars['String']['input']>>;
  tableNumber?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationEditTimeEntryArgs = {
  clockIn?: InputMaybe<Scalars['DateTime']['input']>;
  clockOut?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['String']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
};


export type MutationEditUserRoleArgs = {
  id: Scalars['String']['input'];
  role: Role;
};


export type MutationGenerateShiftsFromTemplateArgs = {
  templateId: Scalars['String']['input'];
  userEmails: Array<Scalars['String']['input']>;
  weekStart: Scalars['DateTime']['input'];
};


export type MutationIncrementUsageCountArgs = {
  id: Scalars['String']['input'];
  setLastUsed?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationMarkAllNotificationsAsReadArgs = {
  search?: InputMaybe<Scalars['String']['input']>;
  userEmail: Scalars['String']['input'];
};


export type MutationMarkDeliveryDeliveredArgs = {
  orderNumber: Scalars['String']['input'];
};


export type MutationMarkDeliveryReadyArgs = {
  orderNumber: Scalars['String']['input'];
};


export type MutationMarkNotificationAsReadArgs = {
  id: Scalars['String']['input'];
};


export type MutationMovePositionTableArgs = {
  id: Scalars['String']['input'];
  position: Scalars['JSON']['input'];
};


export type MutationPublishShiftsArgs = {
  ids: Array<Scalars['String']['input']>;
};


export type MutationRemoveDriverFromOrderArgs = {
  orderNumber: Scalars['String']['input'];
};


export type MutationRemoveFavoriteArgs = {
  menuId: Scalars['String']['input'];
  userEmail: Scalars['String']['input'];
};


export type MutationRemoveWaitlistEntryArgs = {
  id: Scalars['String']['input'];
};


export type MutationSeatWaitlistEntryArgs = {
  id: Scalars['String']['input'];
};


export type MutationToggleShiftTemplateActiveArgs = {
  id: Scalars['String']['input'];
};


export type MutationToggleTableReservationArgs = {
  id: Scalars['String']['input'];
  reserved: Scalars['Boolean']['input'];
};


export type MutationUpdateManyTablesArgs = {
  updates: Array<UpdateManyTablesInput>;
};


export type MutationUpdateNotificationArgs = {
  id: Scalars['String']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<NotificationPriority>;
  status?: InputMaybe<NotificationStatus>;
};


export type MutationUpdateTableUsageArgs = {
  id: Scalars['String']['input'];
  lastUsed?: InputMaybe<Scalars['DateTime']['input']>;
  usageCount?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationUpdateUserProfileArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  image?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateWaitlistEntryArgs = {
  id: Scalars['String']['input'];
  numOfDiners?: InputMaybe<Scalars['Int']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<WaitlistStatus>;
};

export type Notification = {
  __typename?: 'Notification';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  priority: NotificationPriority;
  status: NotificationStatus;
  type: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userEmail: Scalars['String']['output'];
};

export enum NotificationPriority {
  High = 'HIGH',
  Low = 'LOW',
  Normal = 'NORMAL'
}

export enum NotificationStatus {
  Read = 'READ',
  Unread = 'UNREAD'
}

export type Order = {
  __typename?: 'Order';
  cart: Scalars['JSON']['output'];
  createdAt: Scalars['DateTime']['output'];
  delivery?: Maybe<Delivery>;
  deliveryAddress: Scalars['String']['output'];
  deliveryFee: Scalars['Float']['output'];
  deliveryTime?: Maybe<Scalars['DateTime']['output']>;
  discount?: Maybe<Scalars['Float']['output']>;
  id: Scalars['String']['output'];
  items?: Maybe<Scalars['JSON']['output']>;
  note?: Maybe<Scalars['String']['output']>;
  orderDate: Scalars['DateTime']['output'];
  orderNumber: Scalars['String']['output'];
  paid: Scalars['Boolean']['output'];
  paymentToken?: Maybe<Scalars['String']['output']>;
  pickupTime?: Maybe<Scalars['DateTime']['output']>;
  preOrder: Scalars['Boolean']['output'];
  serviceFee: Scalars['Float']['output'];
  specialNotes?: Maybe<Scalars['String']['output']>;
  status: OrderStatus;
  table?: Maybe<Table>;
  tableId?: Maybe<Scalars['String']['output']>;
  total: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userEmail: Scalars['String']['output'];
  userName: Scalars['String']['output'];
  userPhone: Scalars['String']['output'];
};

/** All possible statuses an order can have. */
export enum OrderStatus {
  Cancelled = 'CANCELLED',
  Collected = 'COLLECTED',
  Completed = 'COMPLETED',
  Delivered = 'DELIVERED',
  Pending = 'PENDING',
  Preparing = 'PREPARING',
  Ready = 'READY',
  Served = 'SERVED',
  Unassigned = 'UNASSIGNED'
}

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type Profile = {
  __typename?: 'Profile';
  email: User;
  id: Scalars['ID']['output'];
  img?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  getActiveClockIn?: Maybe<TimeEntry>;
  getAllTableUsages: Array<TableUsage>;
  getArea: Area;
  getAreas: Array<Area>;
  getAreasNameDescription: Array<BasicArea>;
  getAreasWithAvailability: Array<AreaAvailability>;
  getAttendanceSummary: AttendanceSummary;
  getAvailableTables: Array<Table>;
  getAvailableTablesForReservation: Array<Table>;
  getCategories: Array<Category>;
  getCategory: Category;
  getChildAreas: Array<Area>;
  getDashboardKpis: DashboardKpis;
  getDashboardKpisCompare: DashboardKpisCompare;
  getDashboardRevenue: Array<DashboardRevenuePoint>;
  getDashboardRevenueCompare: DashboardRevenueCompare;
  getDeliveryOrders: QueryGetDeliveryOrdersConnection;
  getEmployeeDashboardKpis: EmployeeDashboardKpis;
  getFavorites: Array<Favorite>;
  getGridConfig: GridConfig;
  getGridConfigByArea?: Maybe<GridConfig>;
  getGridConfigs: Array<GridConfig>;
  getMenu: Menu;
  getMenuUserFavorites: Array<Menu>;
  getMenus: QueryGetMenusConnection;
  getMyShifts: QueryGetMyShiftsConnection;
  getMyTimeEntries: QueryGetMyTimeEntriesConnection;
  getNotification: Notification;
  getNotifications: Array<Notification>;
  getOrder: Order;
  getOrders: QueryGetOrdersConnection;
  getParentArea?: Maybe<Area>;
  getProfile: Profile;
  getProfiles: Array<Profile>;
  getReservation: Reservation;
  getReservations: Array<Reservation>;
  getRestaurant: Restaurant;
  getRestaurants: Array<Restaurant>;
  getShift: Shift;
  getShiftTemplate: ShiftTemplate;
  getShiftTemplates: Array<ShiftTemplate>;
  getShifts: QueryGetShiftsConnection;
  getTable: Table;
  getTableOrder: Array<Order>;
  getTableReservations: Array<Reservation>;
  getTableUsage: TableUsage;
  getTableUsageByTable?: Maybe<TableUsage>;
  getTables: Array<Table>;
  getTimeEntries: QueryGetTimeEntriesConnection;
  getTimeEntry: TimeEntry;
  getUnreadNotificationsCount: Scalars['Int']['output'];
  getUser: User;
  getUserFavorites: Favorite;
  getUserNotifications: Array<Notification>;
  getUserReservations: Array<Reservation>;
  getUserWaitlistEntries: Array<Waitlist>;
  getUsers: Array<User>;
  getWaitlist: Waitlist;
  getWaitlists: Array<Waitlist>;
  getWeeklySchedule: Array<Shift>;
  searchRestaurants: Array<Restaurant>;
};


export type QueryGetActiveClockInArgs = {
  userEmail?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetAreaArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetAreasNameDescriptionArgs = {
  orderBy?: InputMaybe<AreaOrderByInput>;
};


export type QueryGetAreasWithAvailabilityArgs = {
  date: Scalars['String']['input'];
  numOfDiners: Scalars['Int']['input'];
  time: Scalars['String']['input'];
};


export type QueryGetAttendanceSummaryArgs = {
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
  userEmail?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetAvailableTablesForReservationArgs = {
  areaId?: InputMaybe<Scalars['String']['input']>;
  date: Scalars['String']['input'];
  numOfDiners: Scalars['Int']['input'];
  time: Scalars['String']['input'];
};


export type QueryGetCategoryArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetChildAreasArgs = {
  parentId: Scalars['String']['input'];
};


export type QueryGetDashboardKpisArgs = {
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
};


export type QueryGetDashboardKpisCompareArgs = {
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
};


export type QueryGetDashboardRevenueArgs = {
  from: Scalars['DateTime']['input'];
  groupBy: RevenueGroupBy;
  to: Scalars['DateTime']['input'];
};


export type QueryGetDashboardRevenueCompareArgs = {
  from: Scalars['DateTime']['input'];
  groupBy: RevenueGroupBy;
  to: Scalars['DateTime']['input'];
};


export type QueryGetDeliveryOrdersArgs = {
  after?: InputMaybe<Scalars['ID']['input']>;
  before?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  statusIn?: InputMaybe<Array<OrderStatus>>;
};


export type QueryGetEmployeeDashboardKpisArgs = {
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
};


export type QueryGetGridConfigArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetGridConfigByAreaArgs = {
  areaId: Scalars['String']['input'];
};


export type QueryGetMenuArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetMenuUserFavoritesArgs = {
  menuIds: Array<Scalars['String']['input']>;
  userEmail: Scalars['String']['input'];
};


export type QueryGetMenusArgs = {
  after?: InputMaybe<Scalars['ID']['input']>;
  before?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetMyShiftsArgs = {
  after?: InputMaybe<Scalars['ID']['input']>;
  before?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  from: Scalars['DateTime']['input'];
  last?: InputMaybe<Scalars['Int']['input']>;
  to: Scalars['DateTime']['input'];
};


export type QueryGetMyTimeEntriesArgs = {
  after?: InputMaybe<Scalars['ID']['input']>;
  before?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  from: Scalars['DateTime']['input'];
  last?: InputMaybe<Scalars['Int']['input']>;
  to: Scalars['DateTime']['input'];
};


export type QueryGetNotificationArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetNotificationsArgs = {
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<NotificationStatus>;
  take?: InputMaybe<Scalars['Int']['input']>;
  userEmail?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetOrderArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetOrdersArgs = {
  after?: InputMaybe<Scalars['ID']['input']>;
  before?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  from?: InputMaybe<Scalars['DateTime']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  paid?: InputMaybe<Scalars['Boolean']['input']>;
  preOrder?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  statusIn?: InputMaybe<Array<OrderStatus>>;
  tableId?: InputMaybe<Scalars['String']['input']>;
  to?: InputMaybe<Scalars['DateTime']['input']>;
};


export type QueryGetParentAreaArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetProfileArgs = {
  email: Scalars['String']['input'];
};


export type QueryGetReservationArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetReservationsArgs = {
  status?: InputMaybe<ReservationStatus>;
};


export type QueryGetRestaurantArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetShiftArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetShiftTemplateArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetShiftTemplatesArgs = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryGetShiftsArgs = {
  after?: InputMaybe<Scalars['ID']['input']>;
  areaId?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  from: Scalars['DateTime']['input'];
  last?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<ShiftStatus>;
  to: Scalars['DateTime']['input'];
  userEmail?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetTableArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetTableOrderArgs = {
  tableId: Scalars['String']['input'];
};


export type QueryGetTableReservationsArgs = {
  date: Scalars['String']['input'];
  tableId: Scalars['String']['input'];
};


export type QueryGetTableUsageArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetTableUsageByTableArgs = {
  tableId: Scalars['String']['input'];
};


export type QueryGetTimeEntriesArgs = {
  after?: InputMaybe<Scalars['ID']['input']>;
  before?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  from: Scalars['DateTime']['input'];
  last?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<TimeEntryStatus>;
  to: Scalars['DateTime']['input'];
  userEmail?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetTimeEntryArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetUnreadNotificationsCountArgs = {
  userEmail: Scalars['String']['input'];
};


export type QueryGetUserArgs = {
  email: Scalars['String']['input'];
};


export type QueryGetUserFavoritesArgs = {
  userEmail: Scalars['String']['input'];
};


export type QueryGetUserNotificationsArgs = {
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<NotificationStatus>;
  take?: InputMaybe<Scalars['Int']['input']>;
  userEmail: Scalars['String']['input'];
};


export type QueryGetUserReservationsArgs = {
  userEmail: Scalars['String']['input'];
};


export type QueryGetUserWaitlistEntriesArgs = {
  userEmail: Scalars['String']['input'];
};


export type QueryGetWaitlistArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetWeeklyScheduleArgs = {
  areaId?: InputMaybe<Scalars['String']['input']>;
  weekStart: Scalars['DateTime']['input'];
};


export type QuerySearchRestaurantsArgs = {
  keyword: Scalars['String']['input'];
};

export type QueryGetDeliveryOrdersConnection = {
  __typename?: 'QueryGetDeliveryOrdersConnection';
  edges: Array<Maybe<QueryGetDeliveryOrdersConnectionEdge>>;
  pageInfo: PageInfo;
};

export type QueryGetDeliveryOrdersConnectionEdge = {
  __typename?: 'QueryGetDeliveryOrdersConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Order;
};

export type QueryGetMenusConnection = {
  __typename?: 'QueryGetMenusConnection';
  edges: Array<Maybe<QueryGetMenusConnectionEdge>>;
  pageInfo: PageInfo;
};

export type QueryGetMenusConnectionEdge = {
  __typename?: 'QueryGetMenusConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Menu;
};

export type QueryGetMyShiftsConnection = {
  __typename?: 'QueryGetMyShiftsConnection';
  edges: Array<Maybe<QueryGetMyShiftsConnectionEdge>>;
  pageInfo: PageInfo;
};

export type QueryGetMyShiftsConnectionEdge = {
  __typename?: 'QueryGetMyShiftsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Shift;
};

export type QueryGetMyTimeEntriesConnection = {
  __typename?: 'QueryGetMyTimeEntriesConnection';
  edges: Array<Maybe<QueryGetMyTimeEntriesConnectionEdge>>;
  pageInfo: PageInfo;
};

export type QueryGetMyTimeEntriesConnectionEdge = {
  __typename?: 'QueryGetMyTimeEntriesConnectionEdge';
  cursor: Scalars['String']['output'];
  node: TimeEntry;
};

export type QueryGetOrdersConnection = {
  __typename?: 'QueryGetOrdersConnection';
  edges: Array<Maybe<QueryGetOrdersConnectionEdge>>;
  pageInfo: PageInfo;
};

export type QueryGetOrdersConnectionEdge = {
  __typename?: 'QueryGetOrdersConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Order;
};

export type QueryGetShiftsConnection = {
  __typename?: 'QueryGetShiftsConnection';
  edges: Array<Maybe<QueryGetShiftsConnectionEdge>>;
  pageInfo: PageInfo;
};

export type QueryGetShiftsConnectionEdge = {
  __typename?: 'QueryGetShiftsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Shift;
};

export type QueryGetTimeEntriesConnection = {
  __typename?: 'QueryGetTimeEntriesConnection';
  edges: Array<Maybe<QueryGetTimeEntriesConnectionEdge>>;
  pageInfo: PageInfo;
};

export type QueryGetTimeEntriesConnectionEdge = {
  __typename?: 'QueryGetTimeEntriesConnectionEdge';
  cursor: Scalars['String']['output'];
  node: TimeEntry;
};

export type Reservation = {
  __typename?: 'Reservation';
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  createdByUser?: Maybe<User>;
  createdByUserEmail?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  numOfDiners: Scalars['Int']['output'];
  reservationTime: Scalars['DateTime']['output'];
  status: ReservationStatus;
  table: Table;
  tableId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userEmail: Scalars['String']['output'];
};

/** The status of a reservation */
export enum ReservationStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Confirmed = 'CONFIRMED',
  Pending = 'PENDING'
}

export type Restaurant = {
  __typename?: 'Restaurant';
  address?: Maybe<Scalars['String']['output']>;
  areas: Array<Area>;
  bannerImg?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deliveryFee: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  openTimes: Scalars['JSON']['output'];
  rating: Scalars['Float']['output'];
  serviceFee: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export enum RevenueGroupBy {
  Day = 'DAY',
  Month = 'MONTH',
  Week = 'WEEK'
}

/** User roles in the system */
export enum Role {
  Admin = 'ADMIN',
  Delivery = 'DELIVERY',
  Manager = 'MANAGER',
  User = 'USER',
  Waiter = 'WAITER'
}

export type Shift = {
  __typename?: 'Shift';
  area?: Maybe<Area>;
  areaId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdByEmail?: Maybe<Scalars['String']['output']>;
  createdByUser?: Maybe<User>;
  endTime: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  note?: Maybe<Scalars['String']['output']>;
  shiftRole?: Maybe<Role>;
  startTime: Scalars['DateTime']['output'];
  status: ShiftStatus;
  template?: Maybe<ShiftTemplate>;
  templateId?: Maybe<Scalars['String']['output']>;
  timeEntries: Array<TimeEntry>;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userEmail: Scalars['String']['output'];
};

/** The status of a scheduled shift */
export enum ShiftStatus {
  Cancelled = 'CANCELLED',
  Draft = 'DRAFT',
  Published = 'PUBLISHED'
}

export type ShiftTemplate = {
  __typename?: 'ShiftTemplate';
  active: Scalars['Boolean']['output'];
  area?: Maybe<Area>;
  areaId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  crossesMidnight: Scalars['Boolean']['output'];
  dayOfWeek: Scalars['Int']['output'];
  defaultRole?: Maybe<Role>;
  description?: Maybe<Scalars['String']['output']>;
  endTime: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  shifts: Array<Shift>;
  startTime: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc'
}

export type Table = {
  __typename?: 'Table';
  area: Area;
  areaId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  diners: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  orders: Array<Order>;
  position: Scalars['JSON']['output'];
  reservations: Array<Reservation>;
  reserved: Scalars['Boolean']['output'];
  specialRequests: Array<Scalars['String']['output']>;
  tableNumber: Scalars['Int']['output'];
  /** Number of unpaid (not paid) orders for this table */
  unpaidOrdersCount: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  usageStats?: Maybe<TableUsage>;
};

export type TableUsage = {
  __typename?: 'TableUsage';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  lastUsed?: Maybe<Scalars['DateTime']['output']>;
  table: Table;
  tableId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  usageCount: Scalars['Int']['output'];
};

export type TimeEntry = {
  __typename?: 'TimeEntry';
  clockIn: Scalars['DateTime']['output'];
  clockOut?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  editedByEmail?: Maybe<Scalars['String']['output']>;
  editedByUser?: Maybe<User>;
  hoursWorked?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  note?: Maybe<Scalars['String']['output']>;
  shift?: Maybe<Shift>;
  shiftId?: Maybe<Scalars['String']['output']>;
  status: TimeEntryStatus;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userEmail: Scalars['String']['output'];
};

/** The status of a time entry */
export enum TimeEntryStatus {
  Active = 'ACTIVE',
  AutoClosed = 'AUTO_CLOSED',
  Completed = 'COMPLETED',
  Edited = 'EDITED'
}

/** Type of time entry event */
export enum TimeEntryType {
  ClockIn = 'CLOCK_IN',
  ClockOut = 'CLOCK_OUT'
}

export type UpdateManyTablesInput = {
  areaId?: InputMaybe<Scalars['String']['input']>;
  diners?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['String']['input'];
  position?: InputMaybe<Scalars['JSON']['input']>;
  reserved?: InputMaybe<Scalars['Boolean']['input']>;
  specialRequests?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['DateTime']['output'];
  createdReservations?: Maybe<Array<Reservation>>;
  createdShifts?: Maybe<Array<Shift>>;
  editedTimeEntries?: Maybe<Array<TimeEntry>>;
  email?: Maybe<Scalars['String']['output']>;
  favorite?: Maybe<Favorite>;
  id: Scalars['ID']['output'];
  image?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  notifications?: Maybe<Array<Notification>>;
  order: Array<Order>;
  profile?: Maybe<Profile>;
  reservations?: Maybe<Array<Reservation>>;
  role: Role;
  shifts?: Maybe<Array<Shift>>;
  timeEntries?: Maybe<Array<TimeEntry>>;
  updatedAt: Scalars['DateTime']['output'];
  waitlists?: Maybe<Array<Waitlist>>;
};

export type Waitlist = {
  __typename?: 'Waitlist';
  area: Area;
  areaId: Scalars['String']['output'];
  calledAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  numOfDiners: Scalars['Int']['output'];
  priority?: Maybe<Scalars['Int']['output']>;
  seatedAt?: Maybe<Scalars['DateTime']['output']>;
  status: WaitlistStatus;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userEmail: Scalars['String']['output'];
};

/** Status of a waitlist entry */
export enum WaitlistStatus {
  Called = 'CALLED',
  Cancelled = 'CANCELLED',
  Seated = 'SEATED',
  Waiting = 'WAITING'
}

export type AddReservationMutationVariables = Exact<{
  createdBy: Role;
  numOfDiners: Scalars['Int']['input'];
  reservationTime: Scalars['DateTime']['input'];
  tableId: Scalars['String']['input'];
  userEmail: Scalars['String']['input'];
}>;


export type AddReservationMutation = { __typename?: 'Mutation', addReservation: { __typename?: 'Reservation', id: string, status: ReservationStatus, reservationTime: any, numOfDiners: number, table: { __typename?: 'Table', tableNumber: number, diners: number, area: { __typename?: 'Area', name: string } } } };

export type AddGuestReservationMutationVariables = Exact<{
  customerName: Scalars['String']['input'];
  tableId: Scalars['String']['input'];
  reservationTime: Scalars['DateTime']['input'];
  numOfDiners: Scalars['Int']['input'];
  createdBy: Role;
}>;


export type AddGuestReservationMutation = { __typename?: 'Mutation', addGuestReservation: { __typename?: 'Reservation', id: string } };

export type EditReservationMutationVariables = Exact<{
  id: Scalars['String']['input'];
  reservationTime?: InputMaybe<Scalars['DateTime']['input']>;
  numOfDiners?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<ReservationStatus>;
}>;


export type EditReservationMutation = { __typename?: 'Mutation', editReservation: { __typename?: 'Reservation', id: string, reservationTime: any, numOfDiners: number, status: ReservationStatus, updatedAt: any, userEmail: string, tableId: string } };

export type CompleteReservationMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type CompleteReservationMutation = { __typename?: 'Mutation', completeReservation: { __typename?: 'Reservation', id: string, status: ReservationStatus, updatedAt: any } };

export type GetUserReservationsQueryVariables = Exact<{
  userEmail: Scalars['String']['input'];
}>;


export type GetUserReservationsQuery = { __typename?: 'Query', getUserReservations: Array<{ __typename?: 'Reservation', id: string, status: ReservationStatus, reservationTime: any, numOfDiners: number, userEmail: string, createdBy: string, createdAt: any, updatedAt: any, table: { __typename?: 'Table', tableNumber: number, diners: number, area: { __typename?: 'Area', name: string } } }> };

export type GetAvailableTablesForReservationQueryVariables = Exact<{
  date: Scalars['String']['input'];
  time: Scalars['String']['input'];
  numOfDiners: Scalars['Int']['input'];
  areaId?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetAvailableTablesForReservationQuery = { __typename?: 'Query', getAvailableTablesForReservation: Array<{ __typename?: 'Table', id: string, tableNumber: number, diners: number, areaId: string, position: any }> };

export type GetAreasWithAvailabilityQueryVariables = Exact<{
  date: Scalars['String']['input'];
  time: Scalars['String']['input'];
  numOfDiners: Scalars['Int']['input'];
}>;


export type GetAreasWithAvailabilityQuery = { __typename?: 'Query', getAreasWithAvailability: Array<{ __typename?: 'AreaAvailability', id: string, name: string, description?: string | null, floorPlanImage?: string | null, totalTables: number, availableTables: number }> };

export type GetAreaQueryVariables = Exact<{
  getAreaId: Scalars['String']['input'];
}>;


export type GetAreaQuery = { __typename?: 'Query', getArea: { __typename?: 'Area', description?: string | null, floorPlanImage?: string | null, name: string, updatedAt: any, id: string, tables: Array<{ __typename?: 'Table', diners: number, tableNumber: number, position: any, reserved: boolean, specialRequests: Array<string>, id: string }> } };

export type GetAreasQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAreasQuery = { __typename?: 'Query', getAreas: Array<{ __typename?: 'Area', updatedAt: any, name: string, id: string, floorPlanImage?: string | null, description?: string | null, tables: Array<{ __typename?: 'Table', diners: number, id: string, position: any, reserved: boolean, specialRequests: Array<string>, tableNumber: number }> }> };

export type AddAreaMutationVariables = Exact<{
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
}>;


export type AddAreaMutation = { __typename?: 'Mutation', addArea: { __typename?: 'Area', id: string } };

export type DeleteAreaMutationVariables = Exact<{
  deleteAreaId: Scalars['String']['input'];
}>;


export type DeleteAreaMutation = { __typename?: 'Mutation', deleteArea: { __typename?: 'Area', name: string, id: string } };

export type EditAreaMutationVariables = Exact<{
  editAreaId: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  floorPlanImage?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
}>;


export type EditAreaMutation = { __typename?: 'Mutation', editArea: { __typename?: 'Area', id: string } };

export type GetAreasNameDescriptionQueryVariables = Exact<{
  orderBy?: InputMaybe<AreaOrderByInput>;
}>;


export type GetAreasNameDescriptionQuery = { __typename?: 'Query', getAreasNameDescription: Array<{ __typename?: 'BasicArea', createdAt: any, floorPlanImage?: string | null, id: string, name: string }> };

export type GetCategoriesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCategoriesQuery = { __typename?: 'Query', getCategories: Array<{ __typename?: 'Category', id: string, title: string, desc: string, img: string }> };

export type GetCategoryQueryVariables = Exact<{
  getCategoryId: Scalars['String']['input'];
}>;


export type GetCategoryQuery = { __typename?: 'Query', getCategory: { __typename?: 'Category', id: string, title: string, desc: string, img: string } };

export type AddCategoryMutationVariables = Exact<{
  title: Scalars['String']['input'];
  desc: Scalars['String']['input'];
  img: Scalars['String']['input'];
}>;


export type AddCategoryMutation = { __typename?: 'Mutation', addCategory: { __typename?: 'Category', id: string, title: string, desc: string, img: string } };

export type EditCategoryMutationVariables = Exact<{
  editCategoryId: Scalars['String']['input'];
  title: Scalars['String']['input'];
  desc: Scalars['String']['input'];
  img: Scalars['String']['input'];
}>;


export type EditCategoryMutation = { __typename?: 'Mutation', editCategory: { __typename?: 'Category', id: string, title: string, desc: string, img: string } };

export type DeleteCategoryMutationVariables = Exact<{
  deleteCategoryId: Scalars['String']['input'];
}>;


export type DeleteCategoryMutation = { __typename?: 'Mutation', deleteCategory: { __typename?: 'Category', id: string } };

export type GetDeliveryOrdersQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['ID']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  statusIn?: InputMaybe<Array<OrderStatus> | OrderStatus>;
}>;


export type GetDeliveryOrdersQuery = { __typename?: 'Query', getDeliveryOrders: { __typename?: 'QueryGetDeliveryOrdersConnection', pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean }, edges: Array<{ __typename?: 'QueryGetDeliveryOrdersConnectionEdge', cursor: string, node: { __typename?: 'Order', id: string, orderNumber: string, status: OrderStatus, orderDate: any, deliveryTime?: any | null, deliveryAddress: string, userName: string, userEmail: string, userPhone: string, total: number, delivery?: { __typename?: 'Delivery', id: string, orderNum: string, driverName: string, driverEmail: string, driverPhone: string } | null } } | null> } };

export type AssignDriverToOrderMutationVariables = Exact<{
  orderNumber: Scalars['String']['input'];
  driverName: Scalars['String']['input'];
  driverEmail: Scalars['String']['input'];
  driverPhone: Scalars['String']['input'];
}>;


export type AssignDriverToOrderMutation = { __typename?: 'Mutation', assignDriverToOrder: { __typename?: 'Delivery', id: string, orderNum: string, driverName: string, driverEmail: string, driverPhone: string } };

export type RemoveDriverFromOrderMutationVariables = Exact<{
  orderNumber: Scalars['String']['input'];
}>;


export type RemoveDriverFromOrderMutation = { __typename?: 'Mutation', removeDriverFromOrder: boolean };

export type GetEmployeeDashboardKpisQueryVariables = Exact<{
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
}>;


export type GetEmployeeDashboardKpisQuery = { __typename?: 'Query', getEmployeeDashboardKpis: { __typename?: 'EmployeeDashboardKpis', totalShifts: number, publishedShifts: number, cancelledShifts: number, totalHoursWorked: number, avgHoursPerEmployee: number, activeClockIns: number, staffCount: number, uniqueEmployeesWorked: number } };

export type GetUserFavoritesQueryVariables = Exact<{
  userEmail: Scalars['String']['input'];
}>;


export type GetUserFavoritesQuery = { __typename?: 'Query', getUserFavorites: { __typename?: 'Favorite', id: string, menu: Array<string>, userEmail: string } };

export type AddFavoriteMutationVariables = Exact<{
  menuId: Scalars['String']['input'];
  userEmail: Scalars['String']['input'];
}>;


export type AddFavoriteMutation = { __typename?: 'Mutation', addFavorite: { __typename?: 'Favorite', id: string, menu: Array<string> } };

export type RemoveFavoriteMutationVariables = Exact<{
  menuId: Scalars['String']['input'];
  userEmail: Scalars['String']['input'];
}>;


export type RemoveFavoriteMutation = { __typename?: 'Mutation', removeFavorite: { __typename?: 'Favorite', id: string, menu: Array<string> } };

export type GetGridConfigByAreaQueryVariables = Exact<{
  areaId: Scalars['String']['input'];
}>;


export type GetGridConfigByAreaQuery = { __typename?: 'Query', getGridConfigByArea?: { __typename?: 'GridConfig', areaId: string, gridSize: number, id: string } | null };

export type AddGridConfigMutationVariables = Exact<{
  areaId: Scalars['String']['input'];
  gridSize?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AddGridConfigMutation = { __typename?: 'Mutation', addGridConfig: { __typename?: 'GridConfig', areaId: string, gridSize: number, id: string } };

export type EditGridConfigMutationVariables = Exact<{
  editGridConfigId: Scalars['String']['input'];
  gridSize?: InputMaybe<Scalars['Int']['input']>;
}>;


export type EditGridConfigMutation = { __typename?: 'Mutation', editGridConfig: { __typename?: 'GridConfig', areaId: string, gridSize: number, id: string } };

export type AddMenuMutationVariables = Exact<{
  category: Scalars['String']['input'];
  image: Scalars['String']['input'];
  longDescr: Scalars['String']['input'];
  prepType: Array<Scalars['String']['input']> | Scalars['String']['input'];
  price: Scalars['Float']['input'];
  shortDescr: Scalars['String']['input'];
  title: Scalars['String']['input'];
  sellingPrice?: InputMaybe<Scalars['Float']['input']>;
  onPromo: Scalars['Boolean']['input'];
}>;


export type AddMenuMutation = { __typename?: 'Mutation', addMenu: { __typename?: 'Menu', id: string } };

export type EditMenuMutationVariables = Exact<{
  category: Scalars['String']['input'];
  editMenuId: Scalars['String']['input'];
  image: Scalars['String']['input'];
  longDescr: Scalars['String']['input'];
  prepType: Array<Scalars['String']['input']> | Scalars['String']['input'];
  price: Scalars['Float']['input'];
  shortDescr: Scalars['String']['input'];
  title: Scalars['String']['input'];
  sellingPrice?: InputMaybe<Scalars['Float']['input']>;
  onPromo: Scalars['Boolean']['input'];
}>;


export type EditMenuMutation = { __typename?: 'Mutation', editMenu: { __typename?: 'Menu', id: string } };

export type DeleteMenuMutationVariables = Exact<{
  deleteMenuId: Scalars['String']['input'];
}>;


export type DeleteMenuMutation = { __typename?: 'Mutation', deleteMenu: { __typename?: 'Menu', id: string } };

export type GetMenusQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetMenusQuery = { __typename?: 'Query', getMenus: { __typename?: 'QueryGetMenusConnection', pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean }, edges: Array<{ __typename?: 'QueryGetMenusConnectionEdge', cursor: string, node: { __typename?: 'Menu', category: string, id: string, image: string, longDescr?: string | null, onPromo: boolean, prepType: Array<string>, price: number, sellingPrice?: number | null, shortDescr: string, title: string } } | null> } };

export type GetMenuUserFavoritesQueryVariables = Exact<{
  menuIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
  userEmail: Scalars['String']['input'];
}>;


export type GetMenuUserFavoritesQuery = { __typename?: 'Query', getMenuUserFavorites: Array<{ __typename?: 'Menu', category: string, id: string, image: string, longDescr?: string | null, onPromo: boolean, prepType: Array<string>, price: number, sellingPrice?: number | null, shortDescr: string, title: string }> };

export type GetUserNotificationsQueryVariables = Exact<{
  userEmail: Scalars['String']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<NotificationStatus>;
  take?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetUserNotificationsQuery = { __typename?: 'Query', getUserNotifications: Array<{ __typename?: 'Notification', id: string, type: string, message: string, status: NotificationStatus, priority: NotificationPriority, createdAt: any, updatedAt: any }> };

export type GetNotificationsDropdownQueryVariables = Exact<{
  userEmail: Scalars['String']['input'];
}>;


export type GetNotificationsDropdownQuery = { __typename?: 'Query', getUnreadNotificationsCount: number, getUserNotifications: Array<{ __typename?: 'Notification', id: string, type: string, message: string, status: NotificationStatus, priority: NotificationPriority, createdAt: any, updatedAt: any }> };

export type MarkNotificationAsReadMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type MarkNotificationAsReadMutation = { __typename?: 'Mutation', markNotificationAsRead: { __typename?: 'Notification', id: string, status: NotificationStatus, updatedAt: any } };

export type MarkAllNotificationsAsReadMutationVariables = Exact<{
  userEmail: Scalars['String']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type MarkAllNotificationsAsReadMutation = { __typename?: 'Mutation', markAllNotificationsAsRead: number };

export type UpdateNotificationMutationVariables = Exact<{
  id: Scalars['String']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<NotificationStatus>;
  priority?: InputMaybe<NotificationPriority>;
}>;


export type UpdateNotificationMutation = { __typename?: 'Mutation', updateNotification: { __typename?: 'Notification', id: string, message: string, status: NotificationStatus, priority: NotificationPriority, updatedAt: any } };

export type DeleteNotificationMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteNotificationMutation = { __typename?: 'Mutation', deleteNotification: { __typename?: 'Notification', id: string } };

export type AddNotificationMutationVariables = Exact<{
  userEmail: Scalars['String']['input'];
  type: Scalars['String']['input'];
  message: Scalars['String']['input'];
  priority?: InputMaybe<NotificationPriority>;
  status?: InputMaybe<NotificationStatus>;
}>;


export type AddNotificationMutation = { __typename?: 'Mutation', addNotification: { __typename?: 'Notification', id: string, userEmail: string, type: string, message: string, status: NotificationStatus, priority: NotificationPriority, createdAt: any, updatedAt: any } };

export type GetOrdersQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['ID']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  statusIn?: InputMaybe<Array<OrderStatus> | OrderStatus>;
  paid?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetOrdersQuery = { __typename?: 'Query', getOrders: { __typename?: 'QueryGetOrdersConnection', pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean }, edges: Array<{ __typename?: 'QueryGetOrdersConnectionEdge', cursor: string, node: { __typename?: 'Order', id: string, orderNumber: string, orderDate: any, deliveryTime?: any | null, pickupTime?: any | null, userName: string, userEmail: string, userPhone: string, paymentToken?: string | null, paid: boolean, deliveryAddress: string, deliveryFee: number, serviceFee: number, discount?: number | null, total: number, status: OrderStatus, note?: string | null, specialNotes?: string | null, preOrder: boolean, tableId?: string | null, cart: any, items?: any | null } } | null> } };

export type AddOrderMutationVariables = Exact<{
  cart: Scalars['JSON']['input'];
  deliveryAddress: Scalars['String']['input'];
  deliveryFee: Scalars['Float']['input'];
  orderNumber: Scalars['String']['input'];
  serviceFee: Scalars['Float']['input'];
  total: Scalars['Float']['input'];
  userEmail: Scalars['String']['input'];
  userName: Scalars['String']['input'];
  userPhone: Scalars['String']['input'];
  discount?: InputMaybe<Scalars['Float']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
  paymentToken?: InputMaybe<Scalars['String']['input']>;
  items?: InputMaybe<Scalars['JSON']['input']>;
  preOrder?: InputMaybe<Scalars['Boolean']['input']>;
  pickupTime?: InputMaybe<Scalars['DateTime']['input']>;
  specialNotes?: InputMaybe<Scalars['String']['input']>;
  tableId?: InputMaybe<Scalars['String']['input']>;
}>;


export type AddOrderMutation = { __typename?: 'Mutation', addOrder: { __typename?: 'Order', id: string } };

export type EditOrderOnPaymentMutationVariables = Exact<{
  editOrderOnPaymentId: Scalars['String']['input'];
  paymentToken?: InputMaybe<Scalars['String']['input']>;
}>;


export type EditOrderOnPaymentMutation = { __typename?: 'Mutation', editOrderOnPayment: { __typename?: 'Order', id: string } };

export type EditOrderMutationVariables = Exact<{
  editOrderId: Scalars['String']['input'];
  status: OrderStatus;
  deliveryTime?: InputMaybe<Scalars['DateTime']['input']>;
}>;


export type EditOrderMutation = { __typename?: 'Mutation', editOrder: { __typename?: 'Order', id: string } };

export type GetRestaurantsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRestaurantsQuery = { __typename?: 'Query', getRestaurants: Array<{ __typename?: 'Restaurant', id: string, name: string, address?: string | null, bannerImg?: string | null, deliveryFee: number, serviceFee: number, rating: number, openTimes: any, updatedAt: any }> };

export type GetRestaurantQueryVariables = Exact<{
  getRestaurantId: Scalars['String']['input'];
}>;


export type GetRestaurantQuery = { __typename?: 'Query', getRestaurant: { __typename?: 'Restaurant', id: string, name: string, address?: string | null, bannerImg?: string | null, deliveryFee: number, serviceFee: number, rating: number, openTimes: any, updatedAt: any } };

export type AddRestaurantMutationVariables = Exact<{
  name: Scalars['String']['input'];
  address?: InputMaybe<Scalars['String']['input']>;
  bannerImg?: InputMaybe<Scalars['String']['input']>;
  deliveryFee?: InputMaybe<Scalars['Float']['input']>;
  serviceFee?: InputMaybe<Scalars['Float']['input']>;
  rating?: InputMaybe<Scalars['Float']['input']>;
  openTimes?: InputMaybe<Scalars['JSON']['input']>;
}>;


export type AddRestaurantMutation = { __typename?: 'Mutation', addRestaurant: { __typename?: 'Restaurant', id: string, name: string, address?: string | null, bannerImg?: string | null, deliveryFee: number, serviceFee: number, rating: number, openTimes: any, updatedAt: any } };

export type EditRestaurantMutationVariables = Exact<{
  editRestaurantId: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  address?: InputMaybe<Scalars['String']['input']>;
  bannerImg?: InputMaybe<Scalars['String']['input']>;
  deliveryFee?: InputMaybe<Scalars['Float']['input']>;
  serviceFee?: InputMaybe<Scalars['Float']['input']>;
  rating?: InputMaybe<Scalars['Float']['input']>;
  openTimes?: InputMaybe<Scalars['JSON']['input']>;
}>;


export type EditRestaurantMutation = { __typename?: 'Mutation', editRestaurant: { __typename?: 'Restaurant', id: string, name: string, address?: string | null, bannerImg?: string | null, deliveryFee: number, serviceFee: number, rating: number, openTimes: any, updatedAt: any } };

export type DeleteRestaurantMutationVariables = Exact<{
  deleteRestaurantId: Scalars['String']['input'];
}>;


export type DeleteRestaurantMutation = { __typename?: 'Mutation', deleteRestaurant: { __typename?: 'Restaurant', id: string } };

export type GetShiftQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetShiftQuery = { __typename?: 'Query', getShift: { __typename?: 'Shift', id: string, startTime: any, endTime: any, status: ShiftStatus, note?: string | null, shiftRole?: Role | null, userEmail: string, createdByEmail?: string | null, templateId?: string | null, areaId?: string | null, createdAt: any, updatedAt: any, user: { __typename?: 'User', name?: string | null, email?: string | null, image?: string | null }, area?: { __typename?: 'Area', name: string } | null, timeEntries: Array<{ __typename?: 'TimeEntry', id: string, clockIn: any, clockOut?: any | null, hoursWorked?: number | null, status: TimeEntryStatus }> } };

export type GetShiftsQueryVariables = Exact<{
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
  status?: InputMaybe<ShiftStatus>;
  userEmail?: InputMaybe<Scalars['String']['input']>;
  areaId?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetShiftsQuery = { __typename?: 'Query', getShifts: { __typename?: 'QueryGetShiftsConnection', pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean }, edges: Array<{ __typename?: 'QueryGetShiftsConnectionEdge', cursor: string, node: { __typename?: 'Shift', id: string, startTime: any, endTime: any, status: ShiftStatus, note?: string | null, shiftRole?: Role | null, userEmail: string, areaId?: string | null, templateId?: string | null, createdAt: any, user: { __typename?: 'User', name?: string | null, email?: string | null, image?: string | null }, area?: { __typename?: 'Area', name: string } | null } } | null> } };

export type GetMyShiftsQueryVariables = Exact<{
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetMyShiftsQuery = { __typename?: 'Query', getMyShifts: { __typename?: 'QueryGetMyShiftsConnection', pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean }, edges: Array<{ __typename?: 'QueryGetMyShiftsConnectionEdge', cursor: string, node: { __typename?: 'Shift', id: string, startTime: any, endTime: any, status: ShiftStatus, note?: string | null, shiftRole?: Role | null, areaId?: string | null, createdAt: any, area?: { __typename?: 'Area', name: string } | null, timeEntries: Array<{ __typename?: 'TimeEntry', id: string, clockIn: any, clockOut?: any | null, hoursWorked?: number | null, status: TimeEntryStatus }> } } | null> } };

export type GetWeeklyScheduleQueryVariables = Exact<{
  weekStart: Scalars['DateTime']['input'];
  areaId?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetWeeklyScheduleQuery = { __typename?: 'Query', getWeeklySchedule: Array<{ __typename?: 'Shift', id: string, startTime: any, endTime: any, status: ShiftStatus, note?: string | null, shiftRole?: Role | null, userEmail: string, areaId?: string | null, user: { __typename?: 'User', name?: string | null, email?: string | null, image?: string | null }, area?: { __typename?: 'Area', name: string } | null }> };

export type CreateShiftMutationVariables = Exact<{
  userEmail: Scalars['String']['input'];
  startTime: Scalars['DateTime']['input'];
  endTime: Scalars['DateTime']['input'];
  shiftRole?: InputMaybe<Role>;
  areaId?: InputMaybe<Scalars['String']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateShiftMutation = { __typename?: 'Mutation', createShift: { __typename?: 'Shift', id: string, startTime: any, endTime: any, status: ShiftStatus, shiftRole?: Role | null, userEmail: string, areaId?: string | null, note?: string | null, createdAt: any } };

export type EditShiftMutationVariables = Exact<{
  id: Scalars['String']['input'];
  startTime?: InputMaybe<Scalars['DateTime']['input']>;
  endTime?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<ShiftStatus>;
  note?: InputMaybe<Scalars['String']['input']>;
  shiftRole?: InputMaybe<Role>;
  areaId?: InputMaybe<Scalars['String']['input']>;
}>;


export type EditShiftMutation = { __typename?: 'Mutation', editShift: { __typename?: 'Shift', id: string, startTime: any, endTime: any, status: ShiftStatus, shiftRole?: Role | null, note?: string | null, areaId?: string | null, updatedAt: any } };

export type CancelShiftMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type CancelShiftMutation = { __typename?: 'Mutation', cancelShift: { __typename?: 'Shift', id: string, status: ShiftStatus, updatedAt: any } };

export type PublishShiftsMutationVariables = Exact<{
  ids: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type PublishShiftsMutation = { __typename?: 'Mutation', publishShifts: number };

export type GetShiftTemplatesQueryVariables = Exact<{
  active?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetShiftTemplatesQuery = { __typename?: 'Query', getShiftTemplates: Array<{ __typename?: 'ShiftTemplate', id: string, name: string, description?: string | null, dayOfWeek: number, startTime: string, endTime: string, crossesMidnight: boolean, defaultRole?: Role | null, active: boolean, areaId?: string | null, createdAt: any, updatedAt: any, area?: { __typename?: 'Area', name: string } | null }> };

export type GetShiftTemplateQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetShiftTemplateQuery = { __typename?: 'Query', getShiftTemplate: { __typename?: 'ShiftTemplate', id: string, name: string, description?: string | null, dayOfWeek: number, startTime: string, endTime: string, crossesMidnight: boolean, defaultRole?: Role | null, active: boolean, areaId?: string | null, createdAt: any, updatedAt: any, area?: { __typename?: 'Area', name: string } | null, shifts: Array<{ __typename?: 'Shift', id: string, startTime: any, endTime: any, status: ShiftStatus, userEmail: string }> } };

export type CreateShiftTemplateMutationVariables = Exact<{
  name: Scalars['String']['input'];
  dayOfWeek: Scalars['Int']['input'];
  startTime: Scalars['String']['input'];
  endTime: Scalars['String']['input'];
  defaultRole?: InputMaybe<Role>;
  areaId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateShiftTemplateMutation = { __typename?: 'Mutation', createShiftTemplate: { __typename?: 'ShiftTemplate', id: string, name: string, dayOfWeek: number, startTime: string, endTime: string, crossesMidnight: boolean, defaultRole?: Role | null, active: boolean, areaId?: string | null, createdAt: any } };

export type EditShiftTemplateMutationVariables = Exact<{
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  dayOfWeek?: InputMaybe<Scalars['Int']['input']>;
  startTime?: InputMaybe<Scalars['String']['input']>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  defaultRole?: InputMaybe<Role>;
  areaId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
}>;


export type EditShiftTemplateMutation = { __typename?: 'Mutation', editShiftTemplate: { __typename?: 'ShiftTemplate', id: string, name: string, dayOfWeek: number, startTime: string, endTime: string, crossesMidnight: boolean, defaultRole?: Role | null, active: boolean, areaId?: string | null, description?: string | null, updatedAt: any } };

export type DeleteShiftTemplateMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteShiftTemplateMutation = { __typename?: 'Mutation', deleteShiftTemplate: { __typename?: 'ShiftTemplate', id: string } };

export type ToggleShiftTemplateActiveMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type ToggleShiftTemplateActiveMutation = { __typename?: 'Mutation', toggleShiftTemplateActive: { __typename?: 'ShiftTemplate', id: string, active: boolean, updatedAt: any } };

export type GenerateShiftsFromTemplateMutationVariables = Exact<{
  templateId: Scalars['String']['input'];
  weekStart: Scalars['DateTime']['input'];
  userEmails: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type GenerateShiftsFromTemplateMutation = { __typename?: 'Mutation', generateShiftsFromTemplate: number };

export type GetAvailableTablesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAvailableTablesQuery = { __typename?: 'Query', getAvailableTables: Array<{ __typename?: 'Table', areaId: string, id: string, diners: number, tableNumber: number, reservations: Array<{ __typename?: 'Reservation', reservationTime: any }> }> };

export type GetTableQueryVariables = Exact<{
  getTableId: Scalars['String']['input'];
}>;


export type GetTableQuery = { __typename?: 'Query', getTable: { __typename?: 'Table', areaId: string, diners: number, id: string, position: any, reserved: boolean, specialRequests: Array<string>, tableNumber: number, updatedAt: any } };

export type GetTablesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTablesQuery = { __typename?: 'Query', getTables: Array<{ __typename?: 'Table', id: string, tableNumber: number, diners: number, areaId: string, reserved: boolean, specialRequests: Array<string>, unpaidOrdersCount: number, position: any, createdAt: any, updatedAt: any }> };

export type GetTableOrderQueryVariables = Exact<{
  tableId: Scalars['String']['input'];
}>;


export type GetTableOrderQuery = { __typename?: 'Query', getTableOrder: Array<{ __typename?: 'Order', cart: any, deliveryTime?: any | null, discount?: number | null, id: string, note?: string | null, orderDate: any, orderNumber: string, paid: boolean, paymentToken?: string | null, serviceFee: number, status: OrderStatus, total: number, userName: string, userPhone: string }> };

export type GetTableReservationsQueryVariables = Exact<{
  date: Scalars['String']['input'];
  tableId: Scalars['String']['input'];
}>;


export type GetTableReservationsQuery = { __typename?: 'Query', getTableReservations: Array<{ __typename?: 'Reservation', reservationTime: any, numOfDiners: number, status: ReservationStatus, userEmail: string, createdBy: string, id: string, user: { __typename?: 'User', profile?: { __typename?: 'Profile', name?: string | null, phone?: string | null } | null } }> };

export type AddTableMutationVariables = Exact<{
  areaId: Scalars['String']['input'];
  diners: Scalars['Int']['input'];
  position: Scalars['JSON']['input'];
  tableNumber: Scalars['Int']['input'];
}>;


export type AddTableMutation = { __typename?: 'Mutation', addTable: { __typename?: 'Table', id: string, tableNumber: number } };

export type DeleteTableMutationVariables = Exact<{
  deleteTableId: Scalars['String']['input'];
}>;


export type DeleteTableMutation = { __typename?: 'Mutation', deleteTable: { __typename?: 'Table', tableNumber: number } };

export type EditTableMutationVariables = Exact<{
  editTableId: Scalars['String']['input'];
  areaId?: InputMaybe<Scalars['String']['input']>;
  diners?: InputMaybe<Scalars['Int']['input']>;
  position?: InputMaybe<Scalars['JSON']['input']>;
  reserved?: InputMaybe<Scalars['Boolean']['input']>;
  specialRequests?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  tableNumber?: InputMaybe<Scalars['Int']['input']>;
}>;


export type EditTableMutation = { __typename?: 'Mutation', editTable: { __typename?: 'Table', id: string, tableNumber: number } };

export type AddOrderToTableMutationVariables = Exact<{
  cart: Scalars['JSON']['input'];
  orderNumber: Scalars['String']['input'];
  serviceFee: Scalars['Float']['input'];
  tableId: Scalars['String']['input'];
  total: Scalars['Float']['input'];
  userEmail: Scalars['String']['input'];
  userName: Scalars['String']['input'];
  discount?: InputMaybe<Scalars['Float']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
  paymentToken?: InputMaybe<Scalars['String']['input']>;
}>;


export type AddOrderToTableMutation = { __typename?: 'Mutation', addOrderToTable: { __typename?: 'Order', cart: any, discount?: number | null, note?: string | null, orderNumber: string, paymentToken?: string | null, total: number, userEmail: string, userName: string, id: string } };

export type MovePositionTableMutationVariables = Exact<{
  movePositionTableId: Scalars['String']['input'];
  position: Scalars['JSON']['input'];
}>;


export type MovePositionTableMutation = { __typename?: 'Mutation', movePositionTable: { __typename?: 'Table', id: string } };

export type UpdateManyTablesMutationVariables = Exact<{
  updates: Array<UpdateManyTablesInput> | UpdateManyTablesInput;
}>;


export type UpdateManyTablesMutation = { __typename?: 'Mutation', updateManyTables: Array<{ __typename?: 'Table', id: string, tableNumber: number, position: any, areaId: string, reserved: boolean, diners: number, specialRequests: Array<string> }> };

export type ToggleTableReservationMutationVariables = Exact<{
  toggleTableReservationId: Scalars['String']['input'];
  reserved: Scalars['Boolean']['input'];
}>;


export type ToggleTableReservationMutation = { __typename?: 'Mutation', toggleTableReservation: { __typename?: 'Table', id: string, reserved: boolean } };

export type CancelReservationMutationVariables = Exact<{
  cancelReservationId: Scalars['String']['input'];
}>;


export type CancelReservationMutation = { __typename?: 'Mutation', cancelReservation: { __typename?: 'Reservation', id: string, createdByUserEmail?: string | null, numOfDiners: number, reservationTime: any, status: ReservationStatus, tableId: string, updatedAt: any, userEmail: string, table: { __typename?: 'Table', tableNumber: number }, user: { __typename?: 'User', name?: string | null, email?: string | null, profile?: { __typename?: 'Profile', phone?: string | null } | null } } };

export type GetReservationsQueryVariables = Exact<{
  status?: InputMaybe<ReservationStatus>;
}>;


export type GetReservationsQuery = { __typename?: 'Query', getReservations: Array<{ __typename?: 'Reservation', createdAt: any, createdBy: string, id: string, numOfDiners: number, reservationTime: any, status: ReservationStatus, tableId: string, updatedAt: any, userEmail: string, table: { __typename?: 'Table', tableNumber: number }, user: { __typename?: 'User', name?: string | null, profile?: { __typename?: 'Profile', phone?: string | null } | null } }> };

export type GetActiveClockInQueryVariables = Exact<{
  userEmail?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetActiveClockInQuery = { __typename?: 'Query', getActiveClockIn?: { __typename?: 'TimeEntry', id: string, clockIn: any, status: TimeEntryStatus, note?: string | null, userEmail: string, shiftId?: string | null, shift?: { __typename?: 'Shift', id: string, startTime: any, endTime: any, shiftRole?: Role | null } | null } | null };

export type GetTimeEntryQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetTimeEntryQuery = { __typename?: 'Query', getTimeEntry: { __typename?: 'TimeEntry', id: string, clockIn: any, clockOut?: any | null, hoursWorked?: number | null, status: TimeEntryStatus, note?: string | null, userEmail: string, shiftId?: string | null, editedByEmail?: string | null, createdAt: any, updatedAt: any, user: { __typename?: 'User', name?: string | null, email?: string | null, image?: string | null }, shift?: { __typename?: 'Shift', id: string, startTime: any, endTime: any, status: ShiftStatus, shiftRole?: Role | null } | null, editedByUser?: { __typename?: 'User', name?: string | null, email?: string | null } | null } };

export type GetTimeEntriesQueryVariables = Exact<{
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
  userEmail?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<TimeEntryStatus>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetTimeEntriesQuery = { __typename?: 'Query', getTimeEntries: { __typename?: 'QueryGetTimeEntriesConnection', pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean }, edges: Array<{ __typename?: 'QueryGetTimeEntriesConnectionEdge', cursor: string, node: { __typename?: 'TimeEntry', id: string, clockIn: any, clockOut?: any | null, hoursWorked?: number | null, status: TimeEntryStatus, note?: string | null, userEmail: string, shiftId?: string | null, editedByEmail?: string | null, createdAt: any, user: { __typename?: 'User', name?: string | null, email?: string | null, image?: string | null }, shift?: { __typename?: 'Shift', id: string, startTime: any, endTime: any, shiftRole?: Role | null } | null } } | null> } };

export type GetMyTimeEntriesQueryVariables = Exact<{
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetMyTimeEntriesQuery = { __typename?: 'Query', getMyTimeEntries: { __typename?: 'QueryGetMyTimeEntriesConnection', pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean }, edges: Array<{ __typename?: 'QueryGetMyTimeEntriesConnectionEdge', cursor: string, node: { __typename?: 'TimeEntry', id: string, clockIn: any, clockOut?: any | null, hoursWorked?: number | null, status: TimeEntryStatus, note?: string | null, shiftId?: string | null, createdAt: any, shift?: { __typename?: 'Shift', id: string, startTime: any, endTime: any, shiftRole?: Role | null } | null } } | null> } };

export type GetAttendanceSummaryQueryVariables = Exact<{
  from: Scalars['DateTime']['input'];
  to: Scalars['DateTime']['input'];
  userEmail?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetAttendanceSummaryQuery = { __typename?: 'Query', getAttendanceSummary: { __typename?: 'AttendanceSummary', totalHours: number, shiftCount: number, avgHoursPerShift: number, overtimeHours: number, attendanceRate: number, lateCount: number, missedCount: number } };

export type ClockInMutationVariables = Exact<{
  note?: InputMaybe<Scalars['String']['input']>;
}>;


export type ClockInMutation = { __typename?: 'Mutation', clockIn: { __typename?: 'TimeEntry', id: string, clockIn: any, status: TimeEntryStatus, note?: string | null, userEmail: string, shiftId?: string | null } };

export type ClockOutMutationVariables = Exact<{
  timeEntryId?: InputMaybe<Scalars['String']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
}>;


export type ClockOutMutation = { __typename?: 'Mutation', clockOut: { __typename?: 'TimeEntry', id: string, clockIn: any, clockOut?: any | null, hoursWorked?: number | null, status: TimeEntryStatus, note?: string | null } };

export type EditTimeEntryMutationVariables = Exact<{
  id: Scalars['String']['input'];
  clockIn?: InputMaybe<Scalars['DateTime']['input']>;
  clockOut?: InputMaybe<Scalars['DateTime']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
}>;


export type EditTimeEntryMutation = { __typename?: 'Mutation', editTimeEntry: { __typename?: 'TimeEntry', id: string, clockIn: any, clockOut?: any | null, hoursWorked?: number | null, status: TimeEntryStatus, editedByEmail?: string | null, note?: string | null, updatedAt: any } };

export type DeleteTimeEntryMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteTimeEntryMutation = { __typename?: 'Mutation', deleteTimeEntry: { __typename?: 'TimeEntry', id: string } };

export type GetUserQueryVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type GetUserQuery = { __typename?: 'Query', getUser: { __typename?: 'User', email?: string | null, id: string, image?: string | null, name?: string | null, role: Role, order: Array<{ __typename?: 'Order', cart: any, deliveryAddress: string, deliveryFee: number, deliveryTime?: any | null, discount?: number | null, id: string, note?: string | null, orderDate: any, orderNumber: string, paid: boolean, paymentToken?: string | null, serviceFee: number, status: OrderStatus, total: number, userEmail: string, userName: string, userPhone: string, tableId?: string | null }> } };

export type GetProfileQueryVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type GetProfileQuery = { __typename?: 'Query', getProfile: { __typename?: 'Profile', id: string, img?: string | null, name?: string | null, phone?: string | null } };

export type AddProfileMutationVariables = Exact<{
  email: Scalars['String']['input'];
  img?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
}>;


export type AddProfileMutation = { __typename?: 'Mutation', addProfile: { __typename?: 'Profile', id: string } };

export type EditProfileMutationVariables = Exact<{
  email: Scalars['String']['input'];
  img?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
}>;


export type EditProfileMutation = { __typename?: 'Mutation', editProfile: { __typename?: 'Profile', id: string } };

export type AddWaitlistEntryMutationVariables = Exact<{
  userEmail: Scalars['String']['input'];
  areaId: Scalars['String']['input'];
  numOfDiners: Scalars['Int']['input'];
}>;


export type AddWaitlistEntryMutation = { __typename?: 'Mutation', addWaitlistEntry: { __typename?: 'Waitlist', id: string, status: WaitlistStatus, numOfDiners: number, createdAt: any, area: { __typename?: 'Area', name: string } } };

export type CancelWaitlistEntryMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type CancelWaitlistEntryMutation = { __typename?: 'Mutation', cancelWaitlistEntry: { __typename?: 'Waitlist', id: string, status: WaitlistStatus } };

export type GetUserWaitlistEntriesQueryVariables = Exact<{
  userEmail: Scalars['String']['input'];
}>;


export type GetUserWaitlistEntriesQuery = { __typename?: 'Query', getUserWaitlistEntries: Array<{ __typename?: 'Waitlist', id: string, status: WaitlistStatus, numOfDiners: number, calledAt?: any | null, seatedAt?: any | null, createdAt: any, updatedAt: any, area: { __typename?: 'Area', name: string } }> };


export const AddReservationDocument = gql`
    mutation AddReservation($createdBy: Role!, $numOfDiners: Int!, $reservationTime: DateTime!, $tableId: String!, $userEmail: String!) {
  addReservation(
    createdBy: $createdBy
    numOfDiners: $numOfDiners
    reservationTime: $reservationTime
    tableId: $tableId
    userEmail: $userEmail
  ) {
    id
    status
    reservationTime
    numOfDiners
    table {
      tableNumber
      diners
      area {
        name
      }
    }
  }
}
    `;

export function useAddReservationMutation() {
  return Urql.useMutation<AddReservationMutation, AddReservationMutationVariables>(AddReservationDocument);
};
export const AddGuestReservationDocument = gql`
    mutation AddGuestReservation($customerName: String!, $tableId: String!, $reservationTime: DateTime!, $numOfDiners: Int!, $createdBy: Role!) {
  addGuestReservation(
    customerName: $customerName
    tableId: $tableId
    reservationTime: $reservationTime
    numOfDiners: $numOfDiners
    createdBy: $createdBy
  ) {
    id
  }
}
    `;

export function useAddGuestReservationMutation() {
  return Urql.useMutation<AddGuestReservationMutation, AddGuestReservationMutationVariables>(AddGuestReservationDocument);
};
export const EditReservationDocument = gql`
    mutation EditReservation($id: String!, $reservationTime: DateTime, $numOfDiners: Int, $status: ReservationStatus) {
  editReservation(
    id: $id
    reservationTime: $reservationTime
    numOfDiners: $numOfDiners
    status: $status
  ) {
    id
    reservationTime
    numOfDiners
    status
    updatedAt
    userEmail
    tableId
  }
}
    `;

export function useEditReservationMutation() {
  return Urql.useMutation<EditReservationMutation, EditReservationMutationVariables>(EditReservationDocument);
};
export const CompleteReservationDocument = gql`
    mutation CompleteReservation($id: String!) {
  completeReservation(id: $id) {
    id
    status
    updatedAt
  }
}
    `;

export function useCompleteReservationMutation() {
  return Urql.useMutation<CompleteReservationMutation, CompleteReservationMutationVariables>(CompleteReservationDocument);
};
export const GetUserReservationsDocument = gql`
    query GetUserReservations($userEmail: String!) {
  getUserReservations(userEmail: $userEmail) {
    id
    status
    reservationTime
    numOfDiners
    userEmail
    createdBy
    createdAt
    updatedAt
    table {
      tableNumber
      diners
      area {
        name
      }
    }
  }
}
    `;

export function useGetUserReservationsQuery(options: Omit<Urql.UseQueryArgs<GetUserReservationsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetUserReservationsQuery, GetUserReservationsQueryVariables>({ query: GetUserReservationsDocument, ...options });
};
export const GetAvailableTablesForReservationDocument = gql`
    query GetAvailableTablesForReservation($date: String!, $time: String!, $numOfDiners: Int!, $areaId: String) {
  getAvailableTablesForReservation(
    date: $date
    time: $time
    numOfDiners: $numOfDiners
    areaId: $areaId
  ) {
    id
    tableNumber
    diners
    areaId
    position
  }
}
    `;

export function useGetAvailableTablesForReservationQuery(options: Omit<Urql.UseQueryArgs<GetAvailableTablesForReservationQueryVariables>, 'query'>) {
  return Urql.useQuery<GetAvailableTablesForReservationQuery, GetAvailableTablesForReservationQueryVariables>({ query: GetAvailableTablesForReservationDocument, ...options });
};
export const GetAreasWithAvailabilityDocument = gql`
    query GetAreasWithAvailability($date: String!, $time: String!, $numOfDiners: Int!) {
  getAreasWithAvailability(date: $date, time: $time, numOfDiners: $numOfDiners) {
    id
    name
    description
    floorPlanImage
    totalTables
    availableTables
  }
}
    `;

export function useGetAreasWithAvailabilityQuery(options: Omit<Urql.UseQueryArgs<GetAreasWithAvailabilityQueryVariables>, 'query'>) {
  return Urql.useQuery<GetAreasWithAvailabilityQuery, GetAreasWithAvailabilityQueryVariables>({ query: GetAreasWithAvailabilityDocument, ...options });
};
export const GetAreaDocument = gql`
    query GetArea($getAreaId: String!) {
  getArea(id: $getAreaId) {
    description
    floorPlanImage
    name
    updatedAt
    id
    tables {
      diners
      tableNumber
      position
      reserved
      specialRequests
      id
    }
  }
}
    `;

export function useGetAreaQuery(options: Omit<Urql.UseQueryArgs<GetAreaQueryVariables>, 'query'>) {
  return Urql.useQuery<GetAreaQuery, GetAreaQueryVariables>({ query: GetAreaDocument, ...options });
};
export const GetAreasDocument = gql`
    query GetAreas {
  getAreas {
    updatedAt
    name
    id
    floorPlanImage
    description
    tables {
      diners
      id
      position
      reserved
      specialRequests
      tableNumber
    }
  }
}
    `;

export function useGetAreasQuery(options?: Omit<Urql.UseQueryArgs<GetAreasQueryVariables>, 'query'>) {
  return Urql.useQuery<GetAreasQuery, GetAreasQueryVariables>({ query: GetAreasDocument, ...options });
};
export const AddAreaDocument = gql`
    mutation AddArea($name: String!, $description: String) {
  addArea(name: $name, description: $description) {
    id
  }
}
    `;

export function useAddAreaMutation() {
  return Urql.useMutation<AddAreaMutation, AddAreaMutationVariables>(AddAreaDocument);
};
export const DeleteAreaDocument = gql`
    mutation DeleteArea($deleteAreaId: String!) {
  deleteArea(id: $deleteAreaId) {
    name
    id
  }
}
    `;

export function useDeleteAreaMutation() {
  return Urql.useMutation<DeleteAreaMutation, DeleteAreaMutationVariables>(DeleteAreaDocument);
};
export const EditAreaDocument = gql`
    mutation EditArea($editAreaId: String!, $description: String, $floorPlanImage: String, $name: String) {
  editArea(
    id: $editAreaId
    description: $description
    floorPlanImage: $floorPlanImage
    name: $name
  ) {
    id
  }
}
    `;

export function useEditAreaMutation() {
  return Urql.useMutation<EditAreaMutation, EditAreaMutationVariables>(EditAreaDocument);
};
export const GetAreasNameDescriptionDocument = gql`
    query GetAreasNameDescription($orderBy: AreaOrderByInput) {
  getAreasNameDescription(orderBy: $orderBy) {
    createdAt
    floorPlanImage
    id
    name
  }
}
    `;

export function useGetAreasNameDescriptionQuery(options?: Omit<Urql.UseQueryArgs<GetAreasNameDescriptionQueryVariables>, 'query'>) {
  return Urql.useQuery<GetAreasNameDescriptionQuery, GetAreasNameDescriptionQueryVariables>({ query: GetAreasNameDescriptionDocument, ...options });
};
export const GetCategoriesDocument = gql`
    query GetCategories {
  getCategories {
    id
    title
    desc
    img
  }
}
    `;

export function useGetCategoriesQuery(options?: Omit<Urql.UseQueryArgs<GetCategoriesQueryVariables>, 'query'>) {
  return Urql.useQuery<GetCategoriesQuery, GetCategoriesQueryVariables>({ query: GetCategoriesDocument, ...options });
};
export const GetCategoryDocument = gql`
    query GetCategory($getCategoryId: String!) {
  getCategory(id: $getCategoryId) {
    id
    title
    desc
    img
  }
}
    `;

export function useGetCategoryQuery(options: Omit<Urql.UseQueryArgs<GetCategoryQueryVariables>, 'query'>) {
  return Urql.useQuery<GetCategoryQuery, GetCategoryQueryVariables>({ query: GetCategoryDocument, ...options });
};
export const AddCategoryDocument = gql`
    mutation AddCategory($title: String!, $desc: String!, $img: String!) {
  addCategory(title: $title, desc: $desc, img: $img) {
    id
    title
    desc
    img
  }
}
    `;

export function useAddCategoryMutation() {
  return Urql.useMutation<AddCategoryMutation, AddCategoryMutationVariables>(AddCategoryDocument);
};
export const EditCategoryDocument = gql`
    mutation EditCategory($editCategoryId: String!, $title: String!, $desc: String!, $img: String!) {
  editCategory(id: $editCategoryId, title: $title, desc: $desc, img: $img) {
    id
    title
    desc
    img
  }
}
    `;

export function useEditCategoryMutation() {
  return Urql.useMutation<EditCategoryMutation, EditCategoryMutationVariables>(EditCategoryDocument);
};
export const DeleteCategoryDocument = gql`
    mutation DeleteCategory($deleteCategoryId: String!) {
  deleteCategory(id: $deleteCategoryId) {
    id
  }
}
    `;

export function useDeleteCategoryMutation() {
  return Urql.useMutation<DeleteCategoryMutation, DeleteCategoryMutationVariables>(DeleteCategoryDocument);
};
export const GetDeliveryOrdersDocument = gql`
    query GetDeliveryOrders($first: Int, $after: ID, $search: String, $statusIn: [OrderStatus!]) {
  getDeliveryOrders(
    first: $first
    after: $after
    search: $search
    statusIn: $statusIn
  ) {
    pageInfo {
      endCursor
      hasNextPage
    }
    edges {
      cursor
      node {
        id
        orderNumber
        status
        orderDate
        deliveryTime
        deliveryAddress
        userName
        userEmail
        userPhone
        total
        delivery {
          id
          orderNum
          driverName
          driverEmail
          driverPhone
        }
      }
    }
  }
}
    `;

export function useGetDeliveryOrdersQuery(options?: Omit<Urql.UseQueryArgs<GetDeliveryOrdersQueryVariables>, 'query'>) {
  return Urql.useQuery<GetDeliveryOrdersQuery, GetDeliveryOrdersQueryVariables>({ query: GetDeliveryOrdersDocument, ...options });
};
export const AssignDriverToOrderDocument = gql`
    mutation AssignDriverToOrder($orderNumber: String!, $driverName: String!, $driverEmail: String!, $driverPhone: String!) {
  assignDriverToOrder(
    orderNumber: $orderNumber
    driverName: $driverName
    driverEmail: $driverEmail
    driverPhone: $driverPhone
  ) {
    id
    orderNum
    driverName
    driverEmail
    driverPhone
  }
}
    `;

export function useAssignDriverToOrderMutation() {
  return Urql.useMutation<AssignDriverToOrderMutation, AssignDriverToOrderMutationVariables>(AssignDriverToOrderDocument);
};
export const RemoveDriverFromOrderDocument = gql`
    mutation RemoveDriverFromOrder($orderNumber: String!) {
  removeDriverFromOrder(orderNumber: $orderNumber)
}
    `;

export function useRemoveDriverFromOrderMutation() {
  return Urql.useMutation<RemoveDriverFromOrderMutation, RemoveDriverFromOrderMutationVariables>(RemoveDriverFromOrderDocument);
};
export const GetEmployeeDashboardKpisDocument = gql`
    query GetEmployeeDashboardKpis($from: DateTime!, $to: DateTime!) {
  getEmployeeDashboardKpis(from: $from, to: $to) {
    totalShifts
    publishedShifts
    cancelledShifts
    totalHoursWorked
    avgHoursPerEmployee
    activeClockIns
    staffCount
    uniqueEmployeesWorked
  }
}
    `;

export function useGetEmployeeDashboardKpisQuery(options: Omit<Urql.UseQueryArgs<GetEmployeeDashboardKpisQueryVariables>, 'query'>) {
  return Urql.useQuery<GetEmployeeDashboardKpisQuery, GetEmployeeDashboardKpisQueryVariables>({ query: GetEmployeeDashboardKpisDocument, ...options });
};
export const GetUserFavoritesDocument = gql`
    query GetUserFavorites($userEmail: String!) {
  getUserFavorites(userEmail: $userEmail) {
    id
    menu
    userEmail
  }
}
    `;

export function useGetUserFavoritesQuery(options: Omit<Urql.UseQueryArgs<GetUserFavoritesQueryVariables>, 'query'>) {
  return Urql.useQuery<GetUserFavoritesQuery, GetUserFavoritesQueryVariables>({ query: GetUserFavoritesDocument, ...options });
};
export const AddFavoriteDocument = gql`
    mutation AddFavorite($menuId: String!, $userEmail: String!) {
  addFavorite(menuId: $menuId, userEmail: $userEmail) {
    id
    menu
  }
}
    `;

export function useAddFavoriteMutation() {
  return Urql.useMutation<AddFavoriteMutation, AddFavoriteMutationVariables>(AddFavoriteDocument);
};
export const RemoveFavoriteDocument = gql`
    mutation RemoveFavorite($menuId: String!, $userEmail: String!) {
  removeFavorite(menuId: $menuId, userEmail: $userEmail) {
    id
    menu
  }
}
    `;

export function useRemoveFavoriteMutation() {
  return Urql.useMutation<RemoveFavoriteMutation, RemoveFavoriteMutationVariables>(RemoveFavoriteDocument);
};
export const GetGridConfigByAreaDocument = gql`
    query GetGridConfigByArea($areaId: String!) {
  getGridConfigByArea(areaId: $areaId) {
    areaId
    gridSize
    id
  }
}
    `;

export function useGetGridConfigByAreaQuery(options: Omit<Urql.UseQueryArgs<GetGridConfigByAreaQueryVariables>, 'query'>) {
  return Urql.useQuery<GetGridConfigByAreaQuery, GetGridConfigByAreaQueryVariables>({ query: GetGridConfigByAreaDocument, ...options });
};
export const AddGridConfigDocument = gql`
    mutation AddGridConfig($areaId: String!, $gridSize: Int) {
  addGridConfig(areaId: $areaId, gridSize: $gridSize) {
    areaId
    gridSize
    id
  }
}
    `;

export function useAddGridConfigMutation() {
  return Urql.useMutation<AddGridConfigMutation, AddGridConfigMutationVariables>(AddGridConfigDocument);
};
export const EditGridConfigDocument = gql`
    mutation EditGridConfig($editGridConfigId: String!, $gridSize: Int) {
  editGridConfig(id: $editGridConfigId, gridSize: $gridSize) {
    areaId
    gridSize
    id
  }
}
    `;

export function useEditGridConfigMutation() {
  return Urql.useMutation<EditGridConfigMutation, EditGridConfigMutationVariables>(EditGridConfigDocument);
};
export const AddMenuDocument = gql`
    mutation AddMenu($category: String!, $image: String!, $longDescr: String!, $prepType: [String!]!, $price: Float!, $shortDescr: String!, $title: String!, $sellingPrice: Float, $onPromo: Boolean!) {
  addMenu(
    category: $category
    image: $image
    longDescr: $longDescr
    prepType: $prepType
    price: $price
    shortDescr: $shortDescr
    title: $title
    sellingPrice: $sellingPrice
    onPromo: $onPromo
  ) {
    id
  }
}
    `;

export function useAddMenuMutation() {
  return Urql.useMutation<AddMenuMutation, AddMenuMutationVariables>(AddMenuDocument);
};
export const EditMenuDocument = gql`
    mutation EditMenu($category: String!, $editMenuId: String!, $image: String!, $longDescr: String!, $prepType: [String!]!, $price: Float!, $shortDescr: String!, $title: String!, $sellingPrice: Float, $onPromo: Boolean!) {
  editMenu(
    category: $category
    id: $editMenuId
    image: $image
    longDescr: $longDescr
    prepType: $prepType
    price: $price
    shortDescr: $shortDescr
    title: $title
    sellingPrice: $sellingPrice
    onPromo: $onPromo
  ) {
    id
  }
}
    `;

export function useEditMenuMutation() {
  return Urql.useMutation<EditMenuMutation, EditMenuMutationVariables>(EditMenuDocument);
};
export const DeleteMenuDocument = gql`
    mutation DeleteMenu($deleteMenuId: String!) {
  deleteMenu(id: $deleteMenuId) {
    id
  }
}
    `;

export function useDeleteMenuMutation() {
  return Urql.useMutation<DeleteMenuMutation, DeleteMenuMutationVariables>(DeleteMenuDocument);
};
export const GetMenusDocument = gql`
    query GetMenus($first: Int, $after: ID) {
  getMenus(first: $first, after: $after) {
    pageInfo {
      endCursor
      hasNextPage
    }
    edges {
      cursor
      node {
        category
        id
        image
        longDescr
        onPromo
        prepType
        price
        sellingPrice
        shortDescr
        title
      }
    }
  }
}
    `;

export function useGetMenusQuery(options?: Omit<Urql.UseQueryArgs<GetMenusQueryVariables>, 'query'>) {
  return Urql.useQuery<GetMenusQuery, GetMenusQueryVariables>({ query: GetMenusDocument, ...options });
};
export const GetMenuUserFavoritesDocument = gql`
    query GetMenuUserFavorites($menuIds: [String!]!, $userEmail: String!) {
  getMenuUserFavorites(menuIds: $menuIds, userEmail: $userEmail) {
    category
    id
    image
    longDescr
    onPromo
    prepType
    price
    sellingPrice
    shortDescr
    title
  }
}
    `;

export function useGetMenuUserFavoritesQuery(options: Omit<Urql.UseQueryArgs<GetMenuUserFavoritesQueryVariables>, 'query'>) {
  return Urql.useQuery<GetMenuUserFavoritesQuery, GetMenuUserFavoritesQueryVariables>({ query: GetMenuUserFavoritesDocument, ...options });
};
export const GetUserNotificationsDocument = gql`
    query GetUserNotifications($userEmail: String!, $search: String, $status: NotificationStatus, $take: Int, $skip: Int) {
  getUserNotifications(
    userEmail: $userEmail
    search: $search
    status: $status
    take: $take
    skip: $skip
  ) {
    id
    type
    message
    status
    priority
    createdAt
    updatedAt
  }
}
    `;

export function useGetUserNotificationsQuery(options: Omit<Urql.UseQueryArgs<GetUserNotificationsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetUserNotificationsQuery, GetUserNotificationsQueryVariables>({ query: GetUserNotificationsDocument, ...options });
};
export const GetNotificationsDropdownDocument = gql`
    query GetNotificationsDropdown($userEmail: String!) {
  getUnreadNotificationsCount(userEmail: $userEmail)
  getUserNotifications(userEmail: $userEmail, take: 5) {
    id
    type
    message
    status
    priority
    createdAt
    updatedAt
  }
}
    `;

export function useGetNotificationsDropdownQuery(options: Omit<Urql.UseQueryArgs<GetNotificationsDropdownQueryVariables>, 'query'>) {
  return Urql.useQuery<GetNotificationsDropdownQuery, GetNotificationsDropdownQueryVariables>({ query: GetNotificationsDropdownDocument, ...options });
};
export const MarkNotificationAsReadDocument = gql`
    mutation MarkNotificationAsRead($id: String!) {
  markNotificationAsRead(id: $id) {
    id
    status
    updatedAt
  }
}
    `;

export function useMarkNotificationAsReadMutation() {
  return Urql.useMutation<MarkNotificationAsReadMutation, MarkNotificationAsReadMutationVariables>(MarkNotificationAsReadDocument);
};
export const MarkAllNotificationsAsReadDocument = gql`
    mutation MarkAllNotificationsAsRead($userEmail: String!, $search: String) {
  markAllNotificationsAsRead(userEmail: $userEmail, search: $search)
}
    `;

export function useMarkAllNotificationsAsReadMutation() {
  return Urql.useMutation<MarkAllNotificationsAsReadMutation, MarkAllNotificationsAsReadMutationVariables>(MarkAllNotificationsAsReadDocument);
};
export const UpdateNotificationDocument = gql`
    mutation UpdateNotification($id: String!, $message: String, $status: NotificationStatus, $priority: NotificationPriority) {
  updateNotification(
    id: $id
    message: $message
    status: $status
    priority: $priority
  ) {
    id
    message
    status
    priority
    updatedAt
  }
}
    `;

export function useUpdateNotificationMutation() {
  return Urql.useMutation<UpdateNotificationMutation, UpdateNotificationMutationVariables>(UpdateNotificationDocument);
};
export const DeleteNotificationDocument = gql`
    mutation DeleteNotification($id: String!) {
  deleteNotification(id: $id) {
    id
  }
}
    `;

export function useDeleteNotificationMutation() {
  return Urql.useMutation<DeleteNotificationMutation, DeleteNotificationMutationVariables>(DeleteNotificationDocument);
};
export const AddNotificationDocument = gql`
    mutation AddNotification($userEmail: String!, $type: String!, $message: String!, $priority: NotificationPriority, $status: NotificationStatus) {
  addNotification(
    userEmail: $userEmail
    type: $type
    message: $message
    priority: $priority
    status: $status
  ) {
    id
    userEmail
    type
    message
    status
    priority
    createdAt
    updatedAt
  }
}
    `;

export function useAddNotificationMutation() {
  return Urql.useMutation<AddNotificationMutation, AddNotificationMutationVariables>(AddNotificationDocument);
};
export const GetOrdersDocument = gql`
    query GetOrders($first: Int, $after: ID, $search: String, $statusIn: [OrderStatus!], $paid: Boolean) {
  getOrders(
    first: $first
    after: $after
    search: $search
    statusIn: $statusIn
    paid: $paid
  ) {
    pageInfo {
      endCursor
      hasNextPage
    }
    edges {
      cursor
      node {
        id
        orderNumber
        orderDate
        deliveryTime
        pickupTime
        userName
        userEmail
        userPhone
        paymentToken
        paid
        deliveryAddress
        deliveryFee
        serviceFee
        discount
        total
        status
        note
        specialNotes
        preOrder
        tableId
        cart
        items
      }
    }
  }
}
    `;

export function useGetOrdersQuery(options?: Omit<Urql.UseQueryArgs<GetOrdersQueryVariables>, 'query'>) {
  return Urql.useQuery<GetOrdersQuery, GetOrdersQueryVariables>({ query: GetOrdersDocument, ...options });
};
export const AddOrderDocument = gql`
    mutation AddOrder($cart: JSON!, $deliveryAddress: String!, $deliveryFee: Float!, $orderNumber: String!, $serviceFee: Float!, $total: Float!, $userEmail: String!, $userName: String!, $userPhone: String!, $discount: Float, $note: String, $paymentToken: String, $items: JSON, $preOrder: Boolean, $pickupTime: DateTime, $specialNotes: String, $tableId: String) {
  addOrder(
    cart: $cart
    deliveryAddress: $deliveryAddress
    deliveryFee: $deliveryFee
    orderNumber: $orderNumber
    serviceFee: $serviceFee
    total: $total
    userEmail: $userEmail
    userName: $userName
    userPhone: $userPhone
    discount: $discount
    note: $note
    paymentToken: $paymentToken
    items: $items
    preOrder: $preOrder
    pickupTime: $pickupTime
    specialNotes: $specialNotes
    tableId: $tableId
  ) {
    id
  }
}
    `;

export function useAddOrderMutation() {
  return Urql.useMutation<AddOrderMutation, AddOrderMutationVariables>(AddOrderDocument);
};
export const EditOrderOnPaymentDocument = gql`
    mutation EditOrderOnPayment($editOrderOnPaymentId: String!, $paymentToken: String) {
  editOrderOnPayment(id: $editOrderOnPaymentId, paymentToken: $paymentToken) {
    id
  }
}
    `;

export function useEditOrderOnPaymentMutation() {
  return Urql.useMutation<EditOrderOnPaymentMutation, EditOrderOnPaymentMutationVariables>(EditOrderOnPaymentDocument);
};
export const EditOrderDocument = gql`
    mutation EditOrder($editOrderId: String!, $status: OrderStatus!, $deliveryTime: DateTime) {
  editOrder(id: $editOrderId, status: $status, deliveryTime: $deliveryTime) {
    id
  }
}
    `;

export function useEditOrderMutation() {
  return Urql.useMutation<EditOrderMutation, EditOrderMutationVariables>(EditOrderDocument);
};
export const GetRestaurantsDocument = gql`
    query GetRestaurants {
  getRestaurants {
    id
    name
    address
    bannerImg
    deliveryFee
    serviceFee
    rating
    openTimes
    updatedAt
  }
}
    `;

export function useGetRestaurantsQuery(options?: Omit<Urql.UseQueryArgs<GetRestaurantsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetRestaurantsQuery, GetRestaurantsQueryVariables>({ query: GetRestaurantsDocument, ...options });
};
export const GetRestaurantDocument = gql`
    query GetRestaurant($getRestaurantId: String!) {
  getRestaurant(id: $getRestaurantId) {
    id
    name
    address
    bannerImg
    deliveryFee
    serviceFee
    rating
    openTimes
    updatedAt
  }
}
    `;

export function useGetRestaurantQuery(options: Omit<Urql.UseQueryArgs<GetRestaurantQueryVariables>, 'query'>) {
  return Urql.useQuery<GetRestaurantQuery, GetRestaurantQueryVariables>({ query: GetRestaurantDocument, ...options });
};
export const AddRestaurantDocument = gql`
    mutation AddRestaurant($name: String!, $address: String, $bannerImg: String, $deliveryFee: Float, $serviceFee: Float, $rating: Float, $openTimes: JSON) {
  addRestaurant(
    name: $name
    address: $address
    bannerImg: $bannerImg
    deliveryFee: $deliveryFee
    serviceFee: $serviceFee
    rating: $rating
    openTimes: $openTimes
  ) {
    id
    name
    address
    bannerImg
    deliveryFee
    serviceFee
    rating
    openTimes
    updatedAt
  }
}
    `;

export function useAddRestaurantMutation() {
  return Urql.useMutation<AddRestaurantMutation, AddRestaurantMutationVariables>(AddRestaurantDocument);
};
export const EditRestaurantDocument = gql`
    mutation EditRestaurant($editRestaurantId: String!, $name: String, $address: String, $bannerImg: String, $deliveryFee: Float, $serviceFee: Float, $rating: Float, $openTimes: JSON) {
  editRestaurant(
    id: $editRestaurantId
    name: $name
    address: $address
    bannerImg: $bannerImg
    deliveryFee: $deliveryFee
    serviceFee: $serviceFee
    rating: $rating
    openTimes: $openTimes
  ) {
    id
    name
    address
    bannerImg
    deliveryFee
    serviceFee
    rating
    openTimes
    updatedAt
  }
}
    `;

export function useEditRestaurantMutation() {
  return Urql.useMutation<EditRestaurantMutation, EditRestaurantMutationVariables>(EditRestaurantDocument);
};
export const DeleteRestaurantDocument = gql`
    mutation DeleteRestaurant($deleteRestaurantId: String!) {
  deleteRestaurant(id: $deleteRestaurantId) {
    id
  }
}
    `;

export function useDeleteRestaurantMutation() {
  return Urql.useMutation<DeleteRestaurantMutation, DeleteRestaurantMutationVariables>(DeleteRestaurantDocument);
};
export const GetShiftDocument = gql`
    query GetShift($id: String!) {
  getShift(id: $id) {
    id
    startTime
    endTime
    status
    note
    shiftRole
    userEmail
    createdByEmail
    templateId
    areaId
    user {
      name
      email
      image
    }
    area {
      name
    }
    timeEntries {
      id
      clockIn
      clockOut
      hoursWorked
      status
    }
    createdAt
    updatedAt
  }
}
    `;

export function useGetShiftQuery(options: Omit<Urql.UseQueryArgs<GetShiftQueryVariables>, 'query'>) {
  return Urql.useQuery<GetShiftQuery, GetShiftQueryVariables>({ query: GetShiftDocument, ...options });
};
export const GetShiftsDocument = gql`
    query GetShifts($from: DateTime!, $to: DateTime!, $status: ShiftStatus, $userEmail: String, $areaId: String, $first: Int, $after: ID) {
  getShifts(
    from: $from
    to: $to
    status: $status
    userEmail: $userEmail
    areaId: $areaId
    first: $first
    after: $after
  ) {
    pageInfo {
      endCursor
      hasNextPage
    }
    edges {
      cursor
      node {
        id
        startTime
        endTime
        status
        note
        shiftRole
        userEmail
        areaId
        templateId
        user {
          name
          email
          image
        }
        area {
          name
        }
        createdAt
      }
    }
  }
}
    `;

export function useGetShiftsQuery(options: Omit<Urql.UseQueryArgs<GetShiftsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetShiftsQuery, GetShiftsQueryVariables>({ query: GetShiftsDocument, ...options });
};
export const GetMyShiftsDocument = gql`
    query GetMyShifts($from: DateTime!, $to: DateTime!, $first: Int, $after: ID) {
  getMyShifts(from: $from, to: $to, first: $first, after: $after) {
    pageInfo {
      endCursor
      hasNextPage
    }
    edges {
      cursor
      node {
        id
        startTime
        endTime
        status
        note
        shiftRole
        areaId
        area {
          name
        }
        timeEntries {
          id
          clockIn
          clockOut
          hoursWorked
          status
        }
        createdAt
      }
    }
  }
}
    `;

export function useGetMyShiftsQuery(options: Omit<Urql.UseQueryArgs<GetMyShiftsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetMyShiftsQuery, GetMyShiftsQueryVariables>({ query: GetMyShiftsDocument, ...options });
};
export const GetWeeklyScheduleDocument = gql`
    query GetWeeklySchedule($weekStart: DateTime!, $areaId: String) {
  getWeeklySchedule(weekStart: $weekStart, areaId: $areaId) {
    id
    startTime
    endTime
    status
    note
    shiftRole
    userEmail
    areaId
    user {
      name
      email
      image
    }
    area {
      name
    }
  }
}
    `;

export function useGetWeeklyScheduleQuery(options: Omit<Urql.UseQueryArgs<GetWeeklyScheduleQueryVariables>, 'query'>) {
  return Urql.useQuery<GetWeeklyScheduleQuery, GetWeeklyScheduleQueryVariables>({ query: GetWeeklyScheduleDocument, ...options });
};
export const CreateShiftDocument = gql`
    mutation CreateShift($userEmail: String!, $startTime: DateTime!, $endTime: DateTime!, $shiftRole: Role, $areaId: String, $note: String) {
  createShift(
    userEmail: $userEmail
    startTime: $startTime
    endTime: $endTime
    shiftRole: $shiftRole
    areaId: $areaId
    note: $note
  ) {
    id
    startTime
    endTime
    status
    shiftRole
    userEmail
    areaId
    note
    createdAt
  }
}
    `;

export function useCreateShiftMutation() {
  return Urql.useMutation<CreateShiftMutation, CreateShiftMutationVariables>(CreateShiftDocument);
};
export const EditShiftDocument = gql`
    mutation EditShift($id: String!, $startTime: DateTime, $endTime: DateTime, $status: ShiftStatus, $note: String, $shiftRole: Role, $areaId: String) {
  editShift(
    id: $id
    startTime: $startTime
    endTime: $endTime
    status: $status
    note: $note
    shiftRole: $shiftRole
    areaId: $areaId
  ) {
    id
    startTime
    endTime
    status
    shiftRole
    note
    areaId
    updatedAt
  }
}
    `;

export function useEditShiftMutation() {
  return Urql.useMutation<EditShiftMutation, EditShiftMutationVariables>(EditShiftDocument);
};
export const CancelShiftDocument = gql`
    mutation CancelShift($id: String!) {
  cancelShift(id: $id) {
    id
    status
    updatedAt
  }
}
    `;

export function useCancelShiftMutation() {
  return Urql.useMutation<CancelShiftMutation, CancelShiftMutationVariables>(CancelShiftDocument);
};
export const PublishShiftsDocument = gql`
    mutation PublishShifts($ids: [String!]!) {
  publishShifts(ids: $ids)
}
    `;

export function usePublishShiftsMutation() {
  return Urql.useMutation<PublishShiftsMutation, PublishShiftsMutationVariables>(PublishShiftsDocument);
};
export const GetShiftTemplatesDocument = gql`
    query GetShiftTemplates($active: Boolean) {
  getShiftTemplates(active: $active) {
    id
    name
    description
    dayOfWeek
    startTime
    endTime
    crossesMidnight
    defaultRole
    active
    areaId
    area {
      name
    }
    createdAt
    updatedAt
  }
}
    `;

export function useGetShiftTemplatesQuery(options?: Omit<Urql.UseQueryArgs<GetShiftTemplatesQueryVariables>, 'query'>) {
  return Urql.useQuery<GetShiftTemplatesQuery, GetShiftTemplatesQueryVariables>({ query: GetShiftTemplatesDocument, ...options });
};
export const GetShiftTemplateDocument = gql`
    query GetShiftTemplate($id: String!) {
  getShiftTemplate(id: $id) {
    id
    name
    description
    dayOfWeek
    startTime
    endTime
    crossesMidnight
    defaultRole
    active
    areaId
    area {
      name
    }
    shifts {
      id
      startTime
      endTime
      status
      userEmail
    }
    createdAt
    updatedAt
  }
}
    `;

export function useGetShiftTemplateQuery(options: Omit<Urql.UseQueryArgs<GetShiftTemplateQueryVariables>, 'query'>) {
  return Urql.useQuery<GetShiftTemplateQuery, GetShiftTemplateQueryVariables>({ query: GetShiftTemplateDocument, ...options });
};
export const CreateShiftTemplateDocument = gql`
    mutation CreateShiftTemplate($name: String!, $dayOfWeek: Int!, $startTime: String!, $endTime: String!, $defaultRole: Role, $areaId: String, $description: String) {
  createShiftTemplate(
    name: $name
    dayOfWeek: $dayOfWeek
    startTime: $startTime
    endTime: $endTime
    defaultRole: $defaultRole
    areaId: $areaId
    description: $description
  ) {
    id
    name
    dayOfWeek
    startTime
    endTime
    crossesMidnight
    defaultRole
    active
    areaId
    createdAt
  }
}
    `;

export function useCreateShiftTemplateMutation() {
  return Urql.useMutation<CreateShiftTemplateMutation, CreateShiftTemplateMutationVariables>(CreateShiftTemplateDocument);
};
export const EditShiftTemplateDocument = gql`
    mutation EditShiftTemplate($id: String!, $name: String, $dayOfWeek: Int, $startTime: String, $endTime: String, $defaultRole: Role, $areaId: String, $description: String) {
  editShiftTemplate(
    id: $id
    name: $name
    dayOfWeek: $dayOfWeek
    startTime: $startTime
    endTime: $endTime
    defaultRole: $defaultRole
    areaId: $areaId
    description: $description
  ) {
    id
    name
    dayOfWeek
    startTime
    endTime
    crossesMidnight
    defaultRole
    active
    areaId
    description
    updatedAt
  }
}
    `;

export function useEditShiftTemplateMutation() {
  return Urql.useMutation<EditShiftTemplateMutation, EditShiftTemplateMutationVariables>(EditShiftTemplateDocument);
};
export const DeleteShiftTemplateDocument = gql`
    mutation DeleteShiftTemplate($id: String!) {
  deleteShiftTemplate(id: $id) {
    id
  }
}
    `;

export function useDeleteShiftTemplateMutation() {
  return Urql.useMutation<DeleteShiftTemplateMutation, DeleteShiftTemplateMutationVariables>(DeleteShiftTemplateDocument);
};
export const ToggleShiftTemplateActiveDocument = gql`
    mutation ToggleShiftTemplateActive($id: String!) {
  toggleShiftTemplateActive(id: $id) {
    id
    active
    updatedAt
  }
}
    `;

export function useToggleShiftTemplateActiveMutation() {
  return Urql.useMutation<ToggleShiftTemplateActiveMutation, ToggleShiftTemplateActiveMutationVariables>(ToggleShiftTemplateActiveDocument);
};
export const GenerateShiftsFromTemplateDocument = gql`
    mutation GenerateShiftsFromTemplate($templateId: String!, $weekStart: DateTime!, $userEmails: [String!]!) {
  generateShiftsFromTemplate(
    templateId: $templateId
    weekStart: $weekStart
    userEmails: $userEmails
  )
}
    `;

export function useGenerateShiftsFromTemplateMutation() {
  return Urql.useMutation<GenerateShiftsFromTemplateMutation, GenerateShiftsFromTemplateMutationVariables>(GenerateShiftsFromTemplateDocument);
};
export const GetAvailableTablesDocument = gql`
    query GetAvailableTables {
  getAvailableTables {
    areaId
    id
    diners
    tableNumber
    reservations {
      reservationTime
    }
  }
}
    `;

export function useGetAvailableTablesQuery(options?: Omit<Urql.UseQueryArgs<GetAvailableTablesQueryVariables>, 'query'>) {
  return Urql.useQuery<GetAvailableTablesQuery, GetAvailableTablesQueryVariables>({ query: GetAvailableTablesDocument, ...options });
};
export const GetTableDocument = gql`
    query GetTable($getTableId: String!) {
  getTable(id: $getTableId) {
    areaId
    diners
    id
    position
    reserved
    specialRequests
    tableNumber
    updatedAt
  }
}
    `;

export function useGetTableQuery(options: Omit<Urql.UseQueryArgs<GetTableQueryVariables>, 'query'>) {
  return Urql.useQuery<GetTableQuery, GetTableQueryVariables>({ query: GetTableDocument, ...options });
};
export const GetTablesDocument = gql`
    query GetTables {
  getTables {
    id
    tableNumber
    diners
    areaId
    reserved
    specialRequests
    unpaidOrdersCount
    position
    createdAt
    updatedAt
  }
}
    `;

export function useGetTablesQuery(options?: Omit<Urql.UseQueryArgs<GetTablesQueryVariables>, 'query'>) {
  return Urql.useQuery<GetTablesQuery, GetTablesQueryVariables>({ query: GetTablesDocument, ...options });
};
export const GetTableOrderDocument = gql`
    query GetTableOrder($tableId: String!) {
  getTableOrder(tableId: $tableId) {
    cart
    deliveryTime
    discount
    id
    note
    orderDate
    orderNumber
    paid
    paymentToken
    serviceFee
    status
    total
    userName
    userPhone
  }
}
    `;

export function useGetTableOrderQuery(options: Omit<Urql.UseQueryArgs<GetTableOrderQueryVariables>, 'query'>) {
  return Urql.useQuery<GetTableOrderQuery, GetTableOrderQueryVariables>({ query: GetTableOrderDocument, ...options });
};
export const GetTableReservationsDocument = gql`
    query GetTableReservations($date: String!, $tableId: String!) {
  getTableReservations(date: $date, tableId: $tableId) {
    reservationTime
    numOfDiners
    status
    userEmail
    createdBy
    id
    user {
      profile {
        name
        phone
      }
    }
  }
}
    `;

export function useGetTableReservationsQuery(options: Omit<Urql.UseQueryArgs<GetTableReservationsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetTableReservationsQuery, GetTableReservationsQueryVariables>({ query: GetTableReservationsDocument, ...options });
};
export const AddTableDocument = gql`
    mutation AddTable($areaId: String!, $diners: Int!, $position: JSON!, $tableNumber: Int!) {
  addTable(
    areaId: $areaId
    diners: $diners
    position: $position
    tableNumber: $tableNumber
  ) {
    id
    tableNumber
  }
}
    `;

export function useAddTableMutation() {
  return Urql.useMutation<AddTableMutation, AddTableMutationVariables>(AddTableDocument);
};
export const DeleteTableDocument = gql`
    mutation DeleteTable($deleteTableId: String!) {
  deleteTable(id: $deleteTableId) {
    tableNumber
  }
}
    `;

export function useDeleteTableMutation() {
  return Urql.useMutation<DeleteTableMutation, DeleteTableMutationVariables>(DeleteTableDocument);
};
export const EditTableDocument = gql`
    mutation EditTable($editTableId: String!, $areaId: String, $diners: Int, $position: JSON, $reserved: Boolean, $specialRequests: [String!], $tableNumber: Int) {
  editTable(
    id: $editTableId
    areaId: $areaId
    diners: $diners
    position: $position
    reserved: $reserved
    specialRequests: $specialRequests
    tableNumber: $tableNumber
  ) {
    id
    tableNumber
  }
}
    `;

export function useEditTableMutation() {
  return Urql.useMutation<EditTableMutation, EditTableMutationVariables>(EditTableDocument);
};
export const AddOrderToTableDocument = gql`
    mutation AddOrderToTable($cart: JSON!, $orderNumber: String!, $serviceFee: Float!, $tableId: String!, $total: Float!, $userEmail: String!, $userName: String!, $discount: Float, $note: String, $paymentToken: String) {
  addOrderToTable(
    cart: $cart
    orderNumber: $orderNumber
    serviceFee: $serviceFee
    tableId: $tableId
    total: $total
    userEmail: $userEmail
    userName: $userName
    discount: $discount
    note: $note
    paymentToken: $paymentToken
  ) {
    cart
    discount
    note
    orderNumber
    paymentToken
    total
    userEmail
    userName
    id
  }
}
    `;

export function useAddOrderToTableMutation() {
  return Urql.useMutation<AddOrderToTableMutation, AddOrderToTableMutationVariables>(AddOrderToTableDocument);
};
export const MovePositionTableDocument = gql`
    mutation MovePositionTable($movePositionTableId: String!, $position: JSON!) {
  movePositionTable(id: $movePositionTableId, position: $position) {
    id
  }
}
    `;

export function useMovePositionTableMutation() {
  return Urql.useMutation<MovePositionTableMutation, MovePositionTableMutationVariables>(MovePositionTableDocument);
};
export const UpdateManyTablesDocument = gql`
    mutation UpdateManyTables($updates: [UpdateManyTablesInput!]!) {
  updateManyTables(updates: $updates) {
    id
    tableNumber
    position
    areaId
    reserved
    diners
    specialRequests
  }
}
    `;

export function useUpdateManyTablesMutation() {
  return Urql.useMutation<UpdateManyTablesMutation, UpdateManyTablesMutationVariables>(UpdateManyTablesDocument);
};
export const ToggleTableReservationDocument = gql`
    mutation ToggleTableReservation($toggleTableReservationId: String!, $reserved: Boolean!) {
  toggleTableReservation(id: $toggleTableReservationId, reserved: $reserved) {
    id
    reserved
  }
}
    `;

export function useToggleTableReservationMutation() {
  return Urql.useMutation<ToggleTableReservationMutation, ToggleTableReservationMutationVariables>(ToggleTableReservationDocument);
};
export const CancelReservationDocument = gql`
    mutation CancelReservation($cancelReservationId: String!) {
  cancelReservation(id: $cancelReservationId) {
    id
    createdByUserEmail
    numOfDiners
    reservationTime
    status
    table {
      tableNumber
    }
    tableId
    updatedAt
    userEmail
    user {
      name
      email
      profile {
        phone
      }
    }
  }
}
    `;

export function useCancelReservationMutation() {
  return Urql.useMutation<CancelReservationMutation, CancelReservationMutationVariables>(CancelReservationDocument);
};
export const GetReservationsDocument = gql`
    query GetReservations($status: ReservationStatus) {
  getReservations(status: $status) {
    createdAt
    createdBy
    id
    numOfDiners
    reservationTime
    status
    table {
      tableNumber
    }
    tableId
    updatedAt
    userEmail
    user {
      name
      profile {
        phone
      }
    }
  }
}
    `;

export function useGetReservationsQuery(options?: Omit<Urql.UseQueryArgs<GetReservationsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetReservationsQuery, GetReservationsQueryVariables>({ query: GetReservationsDocument, ...options });
};
export const GetActiveClockInDocument = gql`
    query GetActiveClockIn($userEmail: String) {
  getActiveClockIn(userEmail: $userEmail) {
    id
    clockIn
    status
    note
    userEmail
    shiftId
    shift {
      id
      startTime
      endTime
      shiftRole
    }
  }
}
    `;

export function useGetActiveClockInQuery(options?: Omit<Urql.UseQueryArgs<GetActiveClockInQueryVariables>, 'query'>) {
  return Urql.useQuery<GetActiveClockInQuery, GetActiveClockInQueryVariables>({ query: GetActiveClockInDocument, ...options });
};
export const GetTimeEntryDocument = gql`
    query GetTimeEntry($id: String!) {
  getTimeEntry(id: $id) {
    id
    clockIn
    clockOut
    hoursWorked
    status
    note
    userEmail
    shiftId
    editedByEmail
    user {
      name
      email
      image
    }
    shift {
      id
      startTime
      endTime
      status
      shiftRole
    }
    editedByUser {
      name
      email
    }
    createdAt
    updatedAt
  }
}
    `;

export function useGetTimeEntryQuery(options: Omit<Urql.UseQueryArgs<GetTimeEntryQueryVariables>, 'query'>) {
  return Urql.useQuery<GetTimeEntryQuery, GetTimeEntryQueryVariables>({ query: GetTimeEntryDocument, ...options });
};
export const GetTimeEntriesDocument = gql`
    query GetTimeEntries($from: DateTime!, $to: DateTime!, $userEmail: String, $status: TimeEntryStatus, $first: Int, $after: ID) {
  getTimeEntries(
    from: $from
    to: $to
    userEmail: $userEmail
    status: $status
    first: $first
    after: $after
  ) {
    pageInfo {
      endCursor
      hasNextPage
    }
    edges {
      cursor
      node {
        id
        clockIn
        clockOut
        hoursWorked
        status
        note
        userEmail
        shiftId
        editedByEmail
        user {
          name
          email
          image
        }
        shift {
          id
          startTime
          endTime
          shiftRole
        }
        createdAt
      }
    }
  }
}
    `;

export function useGetTimeEntriesQuery(options: Omit<Urql.UseQueryArgs<GetTimeEntriesQueryVariables>, 'query'>) {
  return Urql.useQuery<GetTimeEntriesQuery, GetTimeEntriesQueryVariables>({ query: GetTimeEntriesDocument, ...options });
};
export const GetMyTimeEntriesDocument = gql`
    query GetMyTimeEntries($from: DateTime!, $to: DateTime!, $first: Int, $after: ID) {
  getMyTimeEntries(from: $from, to: $to, first: $first, after: $after) {
    pageInfo {
      endCursor
      hasNextPage
    }
    edges {
      cursor
      node {
        id
        clockIn
        clockOut
        hoursWorked
        status
        note
        shiftId
        shift {
          id
          startTime
          endTime
          shiftRole
        }
        createdAt
      }
    }
  }
}
    `;

export function useGetMyTimeEntriesQuery(options: Omit<Urql.UseQueryArgs<GetMyTimeEntriesQueryVariables>, 'query'>) {
  return Urql.useQuery<GetMyTimeEntriesQuery, GetMyTimeEntriesQueryVariables>({ query: GetMyTimeEntriesDocument, ...options });
};
export const GetAttendanceSummaryDocument = gql`
    query GetAttendanceSummary($from: DateTime!, $to: DateTime!, $userEmail: String) {
  getAttendanceSummary(from: $from, to: $to, userEmail: $userEmail) {
    totalHours
    shiftCount
    avgHoursPerShift
    overtimeHours
    attendanceRate
    lateCount
    missedCount
  }
}
    `;

export function useGetAttendanceSummaryQuery(options: Omit<Urql.UseQueryArgs<GetAttendanceSummaryQueryVariables>, 'query'>) {
  return Urql.useQuery<GetAttendanceSummaryQuery, GetAttendanceSummaryQueryVariables>({ query: GetAttendanceSummaryDocument, ...options });
};
export const ClockInDocument = gql`
    mutation ClockIn($note: String) {
  clockIn(note: $note) {
    id
    clockIn
    status
    note
    userEmail
    shiftId
  }
}
    `;

export function useClockInMutation() {
  return Urql.useMutation<ClockInMutation, ClockInMutationVariables>(ClockInDocument);
};
export const ClockOutDocument = gql`
    mutation ClockOut($timeEntryId: String, $note: String) {
  clockOut(timeEntryId: $timeEntryId, note: $note) {
    id
    clockIn
    clockOut
    hoursWorked
    status
    note
  }
}
    `;

export function useClockOutMutation() {
  return Urql.useMutation<ClockOutMutation, ClockOutMutationVariables>(ClockOutDocument);
};
export const EditTimeEntryDocument = gql`
    mutation EditTimeEntry($id: String!, $clockIn: DateTime, $clockOut: DateTime, $note: String) {
  editTimeEntry(id: $id, clockIn: $clockIn, clockOut: $clockOut, note: $note) {
    id
    clockIn
    clockOut
    hoursWorked
    status
    editedByEmail
    note
    updatedAt
  }
}
    `;

export function useEditTimeEntryMutation() {
  return Urql.useMutation<EditTimeEntryMutation, EditTimeEntryMutationVariables>(EditTimeEntryDocument);
};
export const DeleteTimeEntryDocument = gql`
    mutation DeleteTimeEntry($id: String!) {
  deleteTimeEntry(id: $id) {
    id
  }
}
    `;

export function useDeleteTimeEntryMutation() {
  return Urql.useMutation<DeleteTimeEntryMutation, DeleteTimeEntryMutationVariables>(DeleteTimeEntryDocument);
};
export const GetUserDocument = gql`
    query GetUser($email: String!) {
  getUser(email: $email) {
    email
    id
    image
    name
    role
    order {
      cart
      deliveryAddress
      deliveryFee
      deliveryTime
      discount
      id
      note
      orderDate
      orderNumber
      paid
      paymentToken
      serviceFee
      status
      total
      userEmail
      userName
      userPhone
      tableId
    }
  }
}
    `;

export function useGetUserQuery(options: Omit<Urql.UseQueryArgs<GetUserQueryVariables>, 'query'>) {
  return Urql.useQuery<GetUserQuery, GetUserQueryVariables>({ query: GetUserDocument, ...options });
};
export const GetProfileDocument = gql`
    query GetProfile($email: String!) {
  getProfile(email: $email) {
    id
    img
    name
    phone
  }
}
    `;

export function useGetProfileQuery(options: Omit<Urql.UseQueryArgs<GetProfileQueryVariables>, 'query'>) {
  return Urql.useQuery<GetProfileQuery, GetProfileQueryVariables>({ query: GetProfileDocument, ...options });
};
export const AddProfileDocument = gql`
    mutation AddProfile($email: String!, $img: String, $name: String, $phone: String) {
  addProfile(email: $email, img: $img, name: $name, phone: $phone) {
    id
  }
}
    `;

export function useAddProfileMutation() {
  return Urql.useMutation<AddProfileMutation, AddProfileMutationVariables>(AddProfileDocument);
};
export const EditProfileDocument = gql`
    mutation EditProfile($email: String!, $img: String, $name: String, $phone: String) {
  editProfile(email: $email, img: $img, name: $name, phone: $phone) {
    id
  }
}
    `;

export function useEditProfileMutation() {
  return Urql.useMutation<EditProfileMutation, EditProfileMutationVariables>(EditProfileDocument);
};
export const AddWaitlistEntryDocument = gql`
    mutation AddWaitlistEntry($userEmail: String!, $areaId: String!, $numOfDiners: Int!) {
  addWaitlistEntry(
    userEmail: $userEmail
    areaId: $areaId
    numOfDiners: $numOfDiners
  ) {
    id
    status
    numOfDiners
    createdAt
    area {
      name
    }
  }
}
    `;

export function useAddWaitlistEntryMutation() {
  return Urql.useMutation<AddWaitlistEntryMutation, AddWaitlistEntryMutationVariables>(AddWaitlistEntryDocument);
};
export const CancelWaitlistEntryDocument = gql`
    mutation CancelWaitlistEntry($id: String!) {
  cancelWaitlistEntry(id: $id) {
    id
    status
  }
}
    `;

export function useCancelWaitlistEntryMutation() {
  return Urql.useMutation<CancelWaitlistEntryMutation, CancelWaitlistEntryMutationVariables>(CancelWaitlistEntryDocument);
};
export const GetUserWaitlistEntriesDocument = gql`
    query GetUserWaitlistEntries($userEmail: String!) {
  getUserWaitlistEntries(userEmail: $userEmail) {
    id
    status
    numOfDiners
    calledAt
    seatedAt
    createdAt
    updatedAt
    area {
      name
    }
  }
}
    `;

export function useGetUserWaitlistEntriesQuery(options: Omit<Urql.UseQueryArgs<GetUserWaitlistEntriesQueryVariables>, 'query'>) {
  return Urql.useQuery<GetUserWaitlistEntriesQuery, GetUserWaitlistEntriesQueryVariables>({ query: GetUserWaitlistEntriesDocument, ...options });
};